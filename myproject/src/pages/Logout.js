import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { serverEndpoint } from "../config/config";
import { CLEAR_USER } from "../redux/user/actions";


function Logout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post(`${serverEndpoint}/auth/logout`, {}, {
                withCredentials: true // to send cookies with the request
            });
            dispatch({
                type: CLEAR_USER,
            });
            navigate('/login');
        } catch (error) {
            console.log(error);
            navigate('/error');
        }
    };

    useEffect(() => {
        handleLogout();
        // eslint-disable-next-line
    }, []);

    return null;
}

export default Logout;