import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getBankMasters,
  getBankMasterById,
  getBankMasterByName,
} from "../store/bankMasterThunk";

import {
  clearBankMasterError,
  clearBankMasterMessage,
  setCurrentBankMaster,
  clearCurrentBankMaster,
  clearBankMasters,
} from "../store/bankMasterSlice";

import {
  selectBankMasters,
  selectCurrentBankMaster,
  selectBankMasterStatus,
  selectBankMasterError,
  selectBankMasterMessage,
  selectGetBankMastersStatus,
  selectGetBankMasterStatus,
  selectBankMasterPagination,
} from "../store/bankMasterSelector";

const useBankMaster = () => {
  const dispatch = useDispatch();

  // ---------------------
  // Data
  // ---------------------
  const bankMasters = useSelector(selectBankMasters);

  const currentBankMaster = useSelector(selectCurrentBankMaster);

  const pagination = useSelector(selectBankMasterPagination);

  // ---------------------
  // Global State
  // ---------------------
  const status = useSelector(selectBankMasterStatus);

  const error = useSelector(selectBankMasterError);

  const message = useSelector(selectBankMasterMessage);

  // ---------------------
  // Status
  // ---------------------
  const getBankMastersStatus = useSelector(selectGetBankMastersStatus);

  const getBankMasterStatus = useSelector(selectGetBankMasterStatus);

  // ---------------------
  // Thunks
  // ---------------------
  const fetchBankMasters = useCallback((params = {}) => {
    return dispatch(getBankMasters(params)).unwrap();
  }, [dispatch]);

  const fetchBankMasterById = useCallback((bankId) => {
    return dispatch(getBankMasterById(bankId)).unwrap();
  }, [dispatch]);

  const fetchBankMasterByName = useCallback((name) => {
    return dispatch(getBankMasterByName(name)).unwrap();
  }, [dispatch]);

  // ---------------------
  // Local Actions
  // ---------------------
  const clearError = useCallback(() => {
    dispatch(clearBankMasterError());
  }, [dispatch]);

  const clearMessage = useCallback(() => {
    dispatch(clearBankMasterMessage());
  }, [dispatch]);

  const saveCurrentBankMaster = useCallback((bankMaster) => {
    dispatch(setCurrentBankMaster(bankMaster));
  }, [dispatch]);

  const removeCurrentBankMaster = useCallback(() => {
    dispatch(clearCurrentBankMaster());
  }, [dispatch]);

  const removeBankMasters = useCallback(() => {
    dispatch(clearBankMasters());
  }, [dispatch]);

  // ---------------------
  // Public API
  // ---------------------
  return {
    // Data
    bankMasters,
    currentBankMaster,

    // Pagination
    pagination,

    // Global State
    status,
    error,
    message,

    // Status
    getBankMastersStatus,
    getBankMasterStatus,

    // API Actions
    getBankMasters: fetchBankMasters,
    getBankMasterById: fetchBankMasterById,
    getBankMasterByName: fetchBankMasterByName,

    // Local Actions
    clearError,
    clearMessage,

    setCurrentBankMaster: saveCurrentBankMaster,

    clearCurrentBankMaster: removeCurrentBankMaster,

    clearBankMasters: removeBankMasters,
  };
};

export default useBankMaster;
