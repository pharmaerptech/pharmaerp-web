import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createCompany,
  getWorkspaceCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyEmployees,
} from "../store/companyThunk";

import {
  clearCompanyError,
  clearCompanyMessage,
  setCurrentCompany,
  clearCurrentCompany,
  clearCompanies,
  clearManagedCompany,
} from "../store/companySlice";

import {
  selectCompanies,
  selectCurrentCompany,
  selectManagedCompany,
  selectCompanyStatus,
  selectCompanyError,
  selectCompanyMessage,
  selectCreateCompanyStatus,
  selectGetWorkspaceCompaniesStatus,
  selectGetCompanyStatus,
  selectUpdateCompanyStatus,
  selectDeleteCompanyStatus,
  selectCompanyEmployees,
} from "../store/companySelector";

const useCompany = () => {
  const dispatch = useDispatch();

  const companies = useSelector(selectCompanies);
  const currentCompany = useSelector(selectCurrentCompany);
  const managedCompany = useSelector(selectManagedCompany);
  const companyEmployees = useSelector(selectCompanyEmployees);

  const status = useSelector(selectCompanyStatus);
  const error = useSelector(selectCompanyError);
  const message = useSelector(selectCompanyMessage);

  const createCompanyStatus = useSelector(selectCreateCompanyStatus);
  const getWorkspaceCompaniesStatus = useSelector(
    selectGetWorkspaceCompaniesStatus,
  );
  const getCompanyStatus = useSelector(selectGetCompanyStatus);
  const updateCompanyStatus = useSelector(selectUpdateCompanyStatus);
  const deleteCompanyStatus = useSelector(selectDeleteCompanyStatus);

  const submitCreateCompany = useCallback(
    (payload) => dispatch(createCompany(payload)).unwrap(),
    [dispatch],
  );

  const fetchWorkspaceCompanies = useCallback(
    () => dispatch(getWorkspaceCompanies()).unwrap(),
    [dispatch],
  );

  const fetchCompanyById = useCallback(
    (companyId) => dispatch(getCompanyById(companyId)).unwrap(),
    [dispatch],
  );

  const fetchCompanyEmployees = useCallback(
    (companyId) => dispatch(getCompanyEmployees(companyId)).unwrap(),
    [dispatch],
  );

  const submitUpdateCompany = useCallback(
    (companyId, payload) =>
      dispatch(
        updateCompany({
          companyId,
          payload,
        }),
      ).unwrap(),
    [dispatch],
  );

  const submitDeleteCompany = useCallback(
    (companyId) => dispatch(deleteCompany(companyId)).unwrap(),
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearCompanyError());
  }, [dispatch]);

  const clearMessage = useCallback(() => {
    dispatch(clearCompanyMessage());
  }, [dispatch]);

    const saveCurrentCompany = useCallback(
    (payload) => {
      dispatch(setCurrentCompany(payload));
      try {
        if (payload?._id) {
          localStorage.setItem("pahuch_active_company_id", payload._id);
        } else {
          localStorage.removeItem("pahuch_active_company_id");
        }
      } catch {}
    },
    [dispatch],
  );

  const removeCurrentCompany = useCallback(() => {
    dispatch(clearCurrentCompany());
    try {
      localStorage.removeItem("pahuch_active_company_id");
    } catch {}
  }, [dispatch]);

  const removeCompanies = useCallback(() => {
    dispatch(clearCompanies());
  }, [dispatch]);

  const removeManagedCompany = useCallback(() => {
    dispatch(clearManagedCompany());
  }, [dispatch]);

  return {
    companies,
    currentCompany,
    managedCompany,
    companyEmployees,

    status,
    error,
    message,

    createCompanyStatus,
    getWorkspaceCompaniesStatus,
    getCompanyStatus,
    updateCompanyStatus,
    deleteCompanyStatus,

    createCompany: submitCreateCompany,
    getWorkspaceCompanies: fetchWorkspaceCompanies,
    getCompanyById: fetchCompanyById,
    getCompanyEmployees: fetchCompanyEmployees,
    updateCompany: submitUpdateCompany,
    deleteCompany: submitDeleteCompany,

    clearError,
    clearMessage,

    setCurrentCompany: saveCurrentCompany,
    clearCurrentCompany: removeCurrentCompany,
    clearCompanies: removeCompanies,
    clearManagedCompany: removeManagedCompany,
  };
};

export default useCompany;
