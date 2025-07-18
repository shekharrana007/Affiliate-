import { useDispatch, useSelector } from "react-redux";
import { CREDIT_PACKS, PLAN_IDS, pricingList } from "../../config/payments";
import { useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../../config/config";
import { SET_USER } from "../../redux/user/actions";
import './PurchaseCredit.css';
import { Modal } from "react-bootstrap";


function PurchaseCredit() {
    const dispatch = useDispatch();
    const userDetails = useSelector((state) => state.userDetails);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false); // <-- Added

    const handlePayment = async (credits) => {
        setShowModal(false);
        try {
            setLoading(true);
            const { data } = await axios.post(`${serverEndpoint}/payments/create-order`, { credits },
                { withCredentials: true }
            );
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                name: 'Affiliate++',
                description: `${credits} Credits pack`,
                order_id: data.order.id,
                theme: { color: '#3399cc' },
                handler: async (response) => {
                    try {
                        const { data } = await axios.post(`${serverEndpoint}/payments/verify-order`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            credits
                        },
                            { withCredentials: true }
                        );
                        dispatch({
                            type: SET_USER,
                            payload: data.user // <-- Use data.user if backend returns { user: ... }
                        });
                        setMessage(`${credits} credits added!`);
                    } catch (error) {
                        console.error(error);
                        setErrors({
                            message: 'Unable to purchase credits, please try again'
                        });
                    } finally {
                        setLoading(false);
                    }
                },
            };
            const razorpayPopup = new window.Razorpay(options);
            razorpayPopup.open();
        } catch (error) {
            setErrors({
                message: 'Unable to create order, please try again'
            });
            setLoading(false);
        }
    };

    const handleSubscribe = async (planKey) => {
        try {
            const { data } = await axios.post(`${serverEndpoint}/payments/create-subscription`, {
                plan_name: planKey
            }, { withCredentials: true });
            const plan = PLAN_IDS[planKey];
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                name: plan.planName,
                description: plan.description,
                subscription_id: data.subscription.id,
                handler: async function (response) {
                    try {
                        const user = await axios.post(`${serverEndpoint}/payments/verify-subscription`, {
                            subscription_id: response.razorpay_subscription_id
                        }, { withCredentials: true });
                        dispatch({
                            type: SET_USER,
                            payload: user.data.user // <-- Use user.data.user if backend returns { user: ... }
                        });
                        setMessage('Subscription activated');
                    } catch (error) {
                        setErrors({ message: 'Unable to activate subscription, please try again' });
                    }
                },
                theme: { color: "#3399cc" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            setErrors({ message: 'Failed to create subscription' });
        }
    };

    return (
        <section className="ezy__pricing10 light py-5" id="ezy__pricing10">
            <div className="container">
                {errors.message && <div className="alert alert-danger">{errors.message}</div>}
                {message && <div className="alert alert-success">{message}</div>}
                <div className="d-flex justify-content-between align-items-start w-100">
                    <div className="text-left">
                        <h3 className="ezy__pricing10-heading">Choose Plan</h3>
                        <p className="ezy__pricing10-sub-heading mt-3">
                            Flexible options: one-time credits or recurring subscriptions.
                        </p>
                    </div>
                    <div className="text-right">
                        <h3>Current Balance</h3>
                        <p className="ezy__pricing10-sub-heading mt-3">
                            {userDetails.credits} Credits
                        </p>
                    </div>
                </div>
                <div className="row">
                    {/* Credit Pack Card */}
                    <div className="col-md-6 col-xl-4 mt-4 text-center">
                        <div className="card ezy__pricing10-card p-4 border-0 rounded-0">
                            <div className="card-body pt-4">
                                <p className="ezy__pricing10-meta-price">
                                    <span className="ezy__pricing10-rate">Credit Packs</span>
                                </p>
                            </div>
                            <div className="card-body pb-4 p-0">
                                <ul className="nav ezy__pricing10-nav flex-column">
                                    {CREDIT_PACKS.map(c => (
                                        <li className="pb-2" key={c}>
                                            {c} CREDITS FOR ₹{c}
                                        </li>
                                    ))}
                                </ul>
                                <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={loading}>
                                    Buy Credits
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Monthly Plan */}
                    <div className="col-md-6 col-xl-4 mt-4 text-center">
                        <div className="card ezy__pricing10-card p-4 border-0 rounded-0">
                            <div className="card-body pt-4">
                                <p className="ezy__pricing10-meta-price">
                                    <span className="ezy__pricing10-rate">₹199/month</span>
                                </p>
                            </div>
                            <div className="card-body pb-4 p-0">
                                <ul className="nav ezy__pricing10-nav flex-column">
                                    {pricingList[1].list.map((item, i) => (
                                        <li className="pb-2" key={i}>{item.detail}</li>
                                    ))}
                                </ul>
                                <button className="btn btn-primary" onClick={() => handleSubscribe('UNLIMITED_MONTHLY')} disabled={loading}>
                                    Subscribe Monthly
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Yearly Plan */}
                    <div className="col-md-6 col-xl-4 mt-4 text-center">
                        <div className="card ezy__pricing10-card p-4 border-0 rounded-0">
                            <div className="card-body pt-4">
                                <p className="ezy__pricing10-meta-price">
                                    <span className="ezy__pricing10-rate">₹1990/year</span>
                                </p>
                            </div>
                            <div className="card-body pb-4 p-0">
                                <ul className="nav ezy__pricing10-nav flex-column">
                                    {pricingList[2].list.map((item, i) => (
                                        <li className="pb-2" key={i}>{item.detail}</li>
                                    ))}
                                </ul>
                                <button className="btn btn-primary" onClick={() => handleSubscribe('UNLIMITED_YEARLY')} disabled={loading}>
                                    Subscribe Yearly
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* React-Bootstrap Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Buy Credits</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                        {CREDIT_PACKS.map((c) => (
                            <button
                                key={c}
                                className="m-2 btn btn-outline-primary"
                                onClick={() => handlePayment(c)}
                                disabled={loading}
                            >
                                Buy {c} Credits
                            </button>
                        ))}
                    </Modal.Body>
                </Modal>
            </div>
        </section>
    );
}
export default PurchaseCredit;