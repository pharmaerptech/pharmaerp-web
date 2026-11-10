import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  sendEmailOtp,
  verifyEmailOtp,
} from "../store/authThunk";

import {
  clearAuthError,
  clearAuthMessage,
  clearCredentials,
  setCredentials,
} from "../store/authSlice";

import {
  selectAuthUser,
  selectAuthToken,
  selectIsAuthenticated,
  selectAuthStatus,
  selectAuthError,
  selectAuthMessage,
  selectForgotPasswordStatus,
  selectResetPasswordStatus,
  selectChangePasswordStatus,
  selectSendEmailOtpStatus,
  selectVerifyEmailOtpStatus,
} from "../store/authSelector";

const useAuth = () => {
  const dispatch = useDispatch();

  const user = useSelector(selectAuthUser);
  const token = useSelector(selectAuthToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const message = useSelector(selectAuthMessage);

  const forgotPasswordStatus = useSelector(selectForgotPasswordStatus);
  const resetPasswordStatus = useSelector(selectResetPasswordStatus);
  const changePasswordStatus = useSelector(selectChangePasswordStatus);
  const sendEmailOtpStatus = useSelector(selectSendEmailOtpStatus);
  const verifyEmailOtpStatus = useSelector(selectVerifyEmailOtpStatus);

  const register = (payload) => {
    return dispatch(registerUser(payload)).unwrap();
  };

  const login = (payload) => {
    return dispatch(loginUser(payload)).unwrap();
  };

  const logout = () => {
    return dispatch(logoutUser()).unwrap();
  };

  const sendForgotPasswordRequest = (payload) => {
    return dispatch(forgotPassword(payload)).unwrap();
  };

  const submitResetPassword = (payload) => {
    return dispatch(resetPassword(payload)).unwrap();
  };

  const submitChangePassword = (payload) => {
    return dispatch(changePassword(payload)).unwrap();
  };

  const submitSendEmailOtp = (payload) => {
    return dispatch(sendEmailOtp(payload)).unwrap();
  };

  const submitVerifyEmailOtp = (payload) => {
    return dispatch(verifyEmailOtp(payload)).unwrap();
  };

  const clearError = () => {
    dispatch(clearAuthError());
  };

  const clearMessage = () => {
    dispatch(clearAuthMessage());
  };

  const saveCredentials = useCallback(
    (payload) => {
      dispatch(setCredentials(payload));
    },
    [dispatch],
  );

  const removeCredentials = useCallback(() => {
    dispatch(clearCredentials());
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,

    status,
    error,
    message,

    forgotPasswordStatus,
    resetPasswordStatus,
    changePasswordStatus,
    sendEmailOtpStatus,
    verifyEmailOtpStatus,

    register,
    login,
    logout,

    forgotPassword: sendForgotPasswordRequest,
    resetPassword: submitResetPassword,
    changePassword: submitChangePassword,
    sendEmailOtp: submitSendEmailOtp,
    verifyEmailOtp: submitVerifyEmailOtp,

    clearError,
    clearMessage,

    setCredentials: saveCredentials,
    clearCredentials: removeCredentials,
  };
};

export default useAuth;
