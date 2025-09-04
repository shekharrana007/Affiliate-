const Clicks = require("../model/Clicks");
const Links = require("../model/Links");
const Users = require('../model/Users');
const axios = require('axios');
const { getDeviceInfo } = require("../util/linksUtility");
const { generateUploadSignature } = require("../service/cloudinaryService");
const linksController = {
    create: async (request, response) => {
        const { campaign_tittle, original_url, category, thumbnail } = request.body;
        console.log(campaign_tittle, original_url, category);
        try {
            const user = await Users.findById({ _id: request.user.id });
            
            // Check if user has active subscription
            const hasActiveSubscription = user.subscription && 
                user.subscription.status === 'active' && 
                user.subscription.end && 
                new Date() < new Date(user.subscription.end);
            
            // If no active subscription, check credits
            if (!hasActiveSubscription && user.credits < 1) {
                return response.status(400).json({
                    code: "INSUFFICIENT_FUNDS",
                    message: "Insufficient Credits. You need at least 1 credit to create a link."
                });
            }

            const link = new Links({
                campaignTittle: campaign_tittle,
                originalUrl: original_url,
                category: category,
                thumbnail: thumbnail,
                user: request.user.role === 'admin' ? request.user.id : request.user.adminId
            });
            await link.save();

            // Only deduct credits if user doesn't have active subscription
            if (!hasActiveSubscription) {
                user.credits -= 1;
                await user.save();
            }
            
            response.status(200).json({
                data: { id: link._id },
                message: "Link created"
            });
        }
        catch (error) {
            console.log(error);
            return response.status(500).json({
                error: "Internal server error"
            });
        }
    },
    getAll: async (request, response) => {
        try {
            const {
                currentPage = 0, pageSize = 10,
                searchTerm = "",
                sortField = "createdAt", sortOrder = "desc"
            } = request.query;

            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;


            const skip = parseInt(currentPage) * parseInt(pageSize);
            const limit = parseInt(pageSize);
            const sort = { [sortField]: sortOrder == "desc" ? -1 : 1 }
            const query = {
                user: userId
            };
            if (searchTerm) {
                query.$or = [
                    { campaignTittle: new RegExp(searchTerm, "i") },
                    { category: new RegExp(searchTerm, "i") },
                    { originalUrl: new RegExp(searchTerm, "i") }
                ];
            }
            const links = await Links.find(query).sort(sort).skip(skip).limit(limit);
            const total =await Links.countDocuments(query);
            return response.json({ data: {links,total} });
        }
        catch (error) {
            console.log(error);
            return response.status(500).json({
                error: "Internal server error"
            });
        }
    },
    getByID: async (request, response) => {
        try {
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ error: "Link id is required" });
            }
            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: "Link does not exist with the given id" });
            }
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;
            //make sure user access to the link belongs to the user
            if (link.user.toString() !== userId) {
                return response.status(403).json({
                    error: "Unauthorized access"
                });
            }
            response.json({ data: link });
        }
        catch (error) {
            console.log(error);
            return response.status(500).json({
                error: "Internal server error"
            });
        }
    },
    update: async (request, response) => {
        console.log('Update endpoint called');
        console.log('Request params:', request.params);
        console.log('Request body:', request.body);
        console.log('User:', request.user);
        try {
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ error: "Link id is required" });
            }
            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: "Link does not exist with the given id" });
            }
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;

            if (link.user.toString() !== userId) {
                return response.status(403).json({
                    error: "Unauthorized access"
                });
            }
            const { campaign_tittle, original_url, category, thumbnail } = request.body;
            
            console.log('Update request body:', request.body);
            console.log('Link ID:', linkId);
            console.log('User ID:', userId);
            
            // Only update thumbnail if it's provided in the request
            const updateData = {
                campaignTittle: campaign_tittle,
                originalUrl: original_url,
                category: category
            };
            
            // Only include thumbnail in update if it's provided
            if (thumbnail !== undefined && thumbnail !== null) {
                updateData.thumbnail = thumbnail;
            }
            
            console.log('Update data:', updateData);
            
            const updatedLink = await Links.findByIdAndUpdate(linkId, updateData, { new: true });
            console.log('Updated link:', updatedLink);
            response.json({ data: updatedLink });
        }
        catch (error) {
            console.error('Update error:', error);
            return response.status(500).json({
                error: "Internal server error"
            });
        }
    },
    delete: async (request, response) => {
        try {
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ error: "Link id is required" });
            }
            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: "Link does not exit with the given id" });
            }
            //make sure user access to the link belongs to the user
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;

            if (link.user.toString() !== userId) {
                return response.status(403).json({
                    error: "Unauthorized access"
                });
            }
            await link.deleteOne();
            response.json({ message: "Link deleted" });

        }
        catch (error) {
            console.log(error);
            return response.status(500).json({
                error: "Internal server error"
            });
        }
    },
    redirect: async (request, response) => {
        try {
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ error: "Link id is required" });
            }
            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: "Link does not exit with the given id" });
            }
            const isDevelopment = process.env.NODE_ENV === 'development';
            const ipAddress = isDevelopment
                ? '8.8.8.8'
                : request.headers['x-forwarded-for']?.split(',')[0] || request.socket.remoteAddress;
            const geoResponse = await axios.get(`http://ip-api.com/json/${ipAddress}`);
            const { city, country, region, lat, lon, isp } = geoResponse.data;
            const userAgent = request.headers['user-agent'] || 'Unknown';
            const { deviceType, browser } = getDeviceInfo(userAgent);
            const referrer = request.get('Referrer') || null;
            await Clicks.create({
                linkId: link._id,
                ip: ipAddress,
                city: city,
                country: country,
                region: region,
                latitude: lat,
                longitude: lon,
                isp: isp,
                referrer: referrer,
                userAgent: userAgent,
                deviceType: deviceType,
                browser: browser,
                clickedAt: new Date()
            });

            link.clickCount += 1;
            await link.save();
            response.redirect(link.originalUrl);
        }
        catch (error) {
            console.log(error);
            return response.status(500).json({
                error: "Internal server error"
            });
        }
    },
    analytics: async (request, response) => {
        try {
            const { linkId, from, to } = request.query;
            const link = await Links.findById(linkId);
            if (!link) {

                return response.status(404).json({
                    error: "Link not found"
                });

            }
            console.log(link);
            const userId = request.user.role === 'admin'
                ? request.user.id : request.user.adminId;
            if (link.user.toString() !== userId) {
                return response.status(403).json({
                    error: "Unauthorized access"
                });
            }
            const query = { linkId: linkId };
            if (from && to) {
                query.clickedAt = { $gte: new Date(from), $lte: new Date(to) };
            }
            const data = await Clicks.find(query).sort({ clickedAt: -1 });
            response.json(data);
        }
        catch (error) {
            console.log(error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },
    createUploadSignature: async(request,response)=>{
        try{
            const{signature,timestamp}=generateUploadSignature();
            response.json({
                timestamp:timestamp,
                signature:signature,
                apiKey:process.env.CLOUDINARY_API_KEY,
                cloudName:process.env.CLOUDINARY_CLOUD_NAME,
            });
        }
        catch(error){
            console.log(error);
            response.status(500).json({message:"Internal server error"});
        }
    },
};
module.exports = linksController;