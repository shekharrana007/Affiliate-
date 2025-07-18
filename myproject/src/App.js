import { Navigate, Route, Routes } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Error from "./pages/Error";
import Logout from "./pages/Logout";
import AppLayout from "./layout/AppLayout";
import Dashboard from './pages/Dashboard';
import UserLayout from "./layout/UserLayout";
import { useDispatch, useSelector } from "react-redux";
import { serverEndpoint } from "./config/config";
import { SET_USER } from "./redux/user/actions";
import Register from "./pages/Register";
import Spinner from "./components/Spinner";
import ManageUsers from "./pages/users/ManageUsers";
import ProtectedRoute from "./rbac/ProtectedRoute";
import UnauthorizedAccess from "./components/UnauthorizedAccess";
import ManagePayments from "./pages/payments/ManagePayments";
import AnalyticsDashboard from "./pages/links/AnalyticsDashboard";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  //trcaking uder deatils in app because app is the component which decides
  //where to navigate based on the current route and it needs to know whether the user is logged in or not
  // const [userDetails, setUserDetails] = useState(null);
  const userDetails = useSelector((state) => state.userDetails);
  const dispatch = useDispatch();
  //this funxtion takes new value of userdetails and update it using setudersdetails function
  // const updateUserDetails = (updatedData) => {
  //   // setUserDetails(updatedData);
  //   dispatch({
  //     type:'SET_USER',
  //     payload: updatedData
  //   });
  // };
  const attemptToRefreshToken = async () => {
    try {
      const response = await axios.post(`${serverEndpoint}/auth/refresh-token`, {}, {
        withCredentials: true
      });
      dispatch({
        type: SET_USER,
        payload: response.data.userDetails
      });
    } catch (error) {
      console.log(error);
    }
  };

  const [loading, setLoading] = useState(true);
  const isUserLoggedIn = async () => {
    try {
      const response = await axios.post(`${serverEndpoint}/auth/is-User-Logged-In`, {}, {
        withCredentials: true //to send cookies with the request
      });
      dispatch({
        type: SET_USER,
        payload: response.data.userDetails
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Token expired, attempting to refresh');
        await attemptToRefreshToken();
      } else {
        console.log('User not loggedin', error);
      }
    }
    finally {
        setLoading(false);
      }
    };
    useEffect(() => {
      isUserLoggedIn();
    }, []);
    if (loading) {
      return <Spinner />;

    }

    return (
      <Routes>
        <Route path="/" element={userDetails ? <UserLayout><Navigate to='/dashboard' /></UserLayout> : <AppLayout><Home /></AppLayout>} />
        {/*we are passing the updateUserDetails function to login beacause thats where we will get user information are authentication*/}
        <Route path="/register" element={userDetails ? <Navigate to='/dashboard' /> : <AppLayout><Register /></AppLayout>} />

        <Route path="/login" element={userDetails ? <Navigate to="/dashboard" /> : <AppLayout><Login /></AppLayout>} />
        <Route path="/forget-password" element={userDetails ? <Navigate to="/dashboard" /> : <AppLayout><ForgetPassword /></AppLayout>} />
        <Route path="/reset-password" element={userDetails ? <UserLayout><ResetPassword /></UserLayout> : <AppLayout><ResetPassword /></AppLayout>} />
        <Route path="/dashboard" element={userDetails ? <UserLayout><Dashboard /></UserLayout> : <Navigate to="/login" />} />
        <Route path="/users" element={userDetails ? <ProtectedRoute roles={['admin']}><UserLayout><ManageUsers /></UserLayout></ProtectedRoute> : <Navigate to='/login' />} />
        <Route path="/unauthorized-access" element={userDetails ? <UserLayout><UnauthorizedAccess /></UserLayout> : <Navigate to="/login" />} />
        <Route path="/logout" element={userDetails ? <Logout /> : <Navigate to="/login" />} />
        <Route path="/error" element={userDetails ? <UserLayout> < Error /> </UserLayout > : <AppLayout><Error /></AppLayout>} />
        <Route path="/manage-payment" element={userDetails ? <UserLayout><ManagePayments /></UserLayout> : <Navigate to='/login' />} />
        <Route path="/analytics/:linkId" element={userDetails ? <UserLayout><AnalyticsDashboard /></UserLayout> : <Navigate to="/login" />} />

      </Routes >
    );
  }

  export default App;
