const permissions = require("../constants/permissions");

const authorize=(requiredPermission)=>{
    //we are returning a middleware function from this function
    return(request,response,next)=>{
        console.log('Authorization middleware called');
        console.log('Required permission:', requiredPermission);
        console.log('Request method:', request.method);
        console.log('Request URL:', request.url);
        
        const user=request.user; //authMiddleware will run before this Middleware
        console.log('User:', user);
        
        if(!user){
            console.log('No user found');
            return response.status(401).json({message:"Unauthorized"});
        }
        const userPermission=permissions[user.role]||[];
        console.log('User role:', user.role);
        console.log('User permissions:', userPermission);
        console.log('Required permission:', requiredPermission);
        console.log('Has permission:', userPermission.includes(requiredPermission));
        
        if(!userPermission.includes(requiredPermission)){
            console.log('Permission denied');
            return response.status(403).json({message:"Forbidden: Insufficient Permission"});
        }
        console.log('Permission granted, proceeding...');
        next();
    };
};
module.exports=authorize;