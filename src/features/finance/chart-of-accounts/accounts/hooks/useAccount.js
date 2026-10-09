import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} from "../store/accountThunk";

import {
  clearAccountError,
  clearAccountMessage,
  setCurrentAccount,
  clearCurrentAccount,
  clearAccounts,
  clearManagedAccount,
} from "../store/accountSlice";

import {
  selectAccounts,
  selectTotalAccounts,
  selectCurrentAccount,
  selectManagedAccount,
  selectAccountStatus,
  selectAccountError,
  selectAccountMessage,
  selectCreateAccountStatus,
  selectGetAccountsStatus,
  selectGetAccountStatus,
  selectUpdateAccountStatus,
  selectDeleteAccountStatus,
} from "../store/accountSelector";

const useAccount = () => {
  const dispatch = useDispatch();

  const accounts = useSelector(selectAccounts);
  const totalAccounts = useSelector(selectTotalAccounts);
  const currentAccount = useSelector(selectCurrentAccount);
  const managedAccount = useSelector(selectManagedAccount);

  const status = useSelector(selectAccountStatus);
  const error = useSelector(selectAccountError);
  const message = useSelector(selectAccountMessage);

  const createAccountStatus = useSelector(selectCreateAccountStatus);

  const getAccountsStatus = useSelector(selectGetAccountsStatus);

  const getAccountStatus = useSelector(selectGetAccountStatus);

  const updateAccountStatus = useSelector(selectUpdateAccountStatus);

  const deleteAccountStatus = useSelector(selectDeleteAccountStatus);

  const submitCreateAccount = useCallback((payload) => {
    return dispatch(createAccount(payload)).unwrap();
  }, [dispatch]);

  const fetchAccounts = useCallback((params = {}) => {
    return dispatch(getAccounts(params)).unwrap();
  }, [dispatch]);

  const fetchAccountById = useCallback((accountId) => {
    return dispatch(getAccountById(accountId)).unwrap();
  }, [dispatch]);

  const submitUpdateAccount = useCallback((accountId, payload) => {
    return dispatch(
      updateAccount({
        accountId,
        payload,
      }),
    ).unwrap();
  }, [dispatch]);

  const submitDeleteAccount = useCallback((accountId) => {
    return dispatch(deleteAccount(accountId)).unwrap();
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAccountError());
  }, [dispatch]);

  const clearMessage = useCallback(() => {
    dispatch(clearAccountMessage());
  }, [dispatch]);

  const saveCurrentAccount = useCallback((payload) => {
    dispatch(setCurrentAccount(payload));
  }, [dispatch]);

  const removeCurrentAccount = useCallback(() => {
    dispatch(clearCurrentAccount());
  }, [dispatch]);

  const removeAccounts = useCallback(() => {
    dispatch(clearAccounts());
  }, [dispatch]);

  const removeManagedAccount = useCallback(() => {
    dispatch(clearManagedAccount());
  }, [dispatch]);

  return {
    accounts,
    totalAccounts,
    currentAccount,
    managedAccount,

    status,
    error,
    message,

    createAccountStatus,
    getAccountsStatus,
    getAccountStatus,
    updateAccountStatus,
    deleteAccountStatus,

    createAccount: submitCreateAccount,
    getAccounts: fetchAccounts,
    getAccountById: fetchAccountById,
    updateAccount: submitUpdateAccount,
    deleteAccount: submitDeleteAccount,

    clearError,
    clearMessage,

    setCurrentAccount: saveCurrentAccount,
    clearCurrentAccount: removeCurrentAccount,
    clearAccounts: removeAccounts,
    clearManagedAccount: removeManagedAccount,
  };
};

export default useAccount;
