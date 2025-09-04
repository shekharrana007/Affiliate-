const jwt = require('jsonwebtoken');
const Users = require('../model/Users');
const authMiddleware={
    protect:async (request, response, next) => {
        try{
            console.log('Auth middleware called');
            console.log('Request method:', request.method);
            console.log('Request URL:', request.url);
            
            const token=request.cookies?.jwttoken;
            console.log('Token exists:', !!token);
            
            if(!token){
                console.log('No token found');
                return response.status(401).json({ message: 'Unauthorized access' });
            }
            const user=jwt.verify(token, process.env.JWT_SECRET);
            console.log('JWT user:', user);
            
            if(user){
                request.user=await Users.findById({_id:user.id});
                console.log('Request user set:', request.user);
            }
            else{
                console.log('Invalid token');
                return response.status(401).json({ message: 'Invalid token' });
            }
           

            next();
        }
        catch(error){
            console.error('Auth middleware error:', error);
            return response.status(500).json({ error: 'Internal server error' });
        }
    },
};
module.exports=authMiddleware;