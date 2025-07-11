const Razorpay = require('razorpay');
const crypto = require('crypto');
const { CREDIT_PACKS, PLAN_IDS } = require('../constants/payments');
const Users = require('../model/Users');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentController = {
    createOrder: async (request, response) => {
        try {

            const { credits } = request.body;
            if (!CREDIT_PACKS[credits]) {
                console.log("Unsupported credit value");
                return response.status(400).json({
                    message: "Unsupported credit value"
                });
            }
            const amount = CREDIT_PACKS[credits] * 100;
            const order = await razorpay.orders.create({
                amount: amount,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
            });
            response.json({
                order: order
            });
        }
        catch (error) {
            console.log(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },
    verifyOrder: async (request, response) => {
        try {
            const {
                razorpay_order_id, razorpay_payment_id, razorpay_signature, credits
            } = request.body;
            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");
            if (expectedSignature !== razorpay_signature) {
                console.log("Signature verification failed");
                return response.status(400).json({
                    message: "Signature verification failed"
                });
            }
            const user = await Users.findById({ _id: request.user.id });
            user.credits += Number(credits);
            await user.save();
            response.json({ user: user });
        }
        catch (error) {
            console.log(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },
    createSubscription: async (request, response) => {
        try {
            const { plan_name } = request.body;
            if (!PLAN_IDS[plan_name]) {
                console.log('Invalid plan name');
                return response.status(400).json({
                    message: 'Invalid plan id'
                });
            }
            const plan = PLAN_IDS[plan_name];
            const subscription = await razorpay.subscriptions.create({
                plan_id: plan.id,
                customer_notify: 1,
                total_count: plan.totalBillingCycleCount,
                // Customer notes field, razorpay sends it as is in the events.
                // We can use this field to set user id so that we know the event
                // belongs to which user in our database.
                notes: {
                    email: request.user.username,
                    userId: request.user.id
                }
            });
            response.json({ subscription: subscription });
        } catch (error) {
            console.log(error);
            response.status(500).json({
                message: 'Internal server error'
            });
        }
    },
    verifySubscription: async (request, response) => {
        try {
            const { subscription_id } = request.body;
            const subscription = await razorpay.subscriptions.fetch(subscription_id);
            const user = await Users.findById(request.user.id);
            user.subscription = {
                id: subscription_id,
                planId: subscription.plan_id,
                status: subscription.status,
                start: subscription.current_start
                    ? new Date(subscription.current_start * 1000)
                    : null,
                end: subscription.current_end
                    ? new Date(subscription.current_end * 1000)
                    : null,
            };
            await user.save();
            response.json({ user: user });
        } catch (error) {
            console.log(error);
            response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    handleWebhookEvent: async (request, response) => {
        try {
            const signature = request.get('x-razorpay-signature');
            const body = request.body; // Buffer if express.raw is used
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(body)
                .digest('hex');
            if (signature !== expectedSignature) {
                console.log('Invalid signature');
                return response.status(400).send('Invalid signature');
            }
            const payload = JSON.parse(body.toString());
            console.log(JSON.stringify(payload, 0, 2));
            const event = payload.event;
            const subscriptionData = payload.payload.subscription.entity;
            const razorpaySubscriptionId = subscriptionData.id;
            let userId = subscriptionData.notes?.userId;
            if (!userId) {
                console.log('UserId not found via notes');
                return response.status(400).send('UserId not found via notes');
            }
            let newStatus = '';
            switch (event) {
                case 'subscription.activated':
                    newStatus = 'active';
                    break;
                case 'subscription.pending':
                    newStatus = 'pending';
                    break;
                case 'subscription.cancelled':
                    newStatus = 'cancelled';
                    break;
                case 'subscription.completed':
                    newStatus = 'completed';
                    break;
                default:
                    console.log('Unhandled event: ', event);
                    return response.status(200).send('Unhandled event');
            }
            const user = await Users.findOneAndUpdate(
                { _id:userId },
                {
                    $set: {
                        'subscription.id': razorpaySubscriptionId,
                        'subscription.status': newStatus,
                        'subscription.start': subscriptionData.start_at
                            ? new Date(subscriptionData.start_at * 1000)
                            : null,
                        'subscription.end': subscriptionData.end_at
                            ? new Date(subscriptionData.end_at * 1000)
                            : null,
                        'subscription.lastBillDate': subscriptionData.current_start
                            ? new Date(subscriptionData.current_start * 1000)
                            : null,
                        'subscription.nextBillDate': subscriptionData.current_end
                            ? new Date(subscriptionData.current_end * 1000)
                            : null,
                        'subscription.paymentsMade': subscriptionData.paid_count,
                        'subscription.paymentsRemaining': subscriptionData.remaining_count,
                    }
                },
                { new: true }
            );
            if (!user) {
                console.log("UserId does not exist");
                return response.status(400).send('UserId does not exist');
            }
            console.log(`Updated subscription for user ${user.username} to ${newStatus}`);
            return response.status(200).send('Event processed');
        } catch (error) {
            console.log(error);
            response.status(500).json({
                message: 'Internal server error'
            });
        }
    },
    cancelSubscription: async (request, response) => {
        try {
            const { subscription_id } = request.body;
            if (!subscription_id) {
                return response.status(400).json({
                    message: 'SubscriptionID is required to cancel'
                });
            }
            const data = await razorpay.subscriptions.cancel(subscription_id);
            response.json(data);
        } catch (error) {
            console.log(error);
            response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

}
module.exports = paymentController;