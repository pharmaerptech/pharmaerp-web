export const selectAccount = (state) => state.account;

export const selectAccounts = (state) => state.account.accounts;
export const selectTotalAccounts = (state) =>
  state.account.totalAccounts ?? state.account.accounts?.length ?? 0;

export const selectCurrentAccount = (state) => state.account.currentAccount;

// Used for details/edit page
export const selectManagedAccount = (state) => state.account.managedAccount;

export const selectAccountStatus = (state) => state.account.status;

export const selectAccountError = (state) => state.account.error;

export const selectAccountMessage = (state) => state.account.message;

export const selectCreateAccountStatus = (state) =>
  state.account.createAccountStatus;

export const selectGetAccountsStatus = (state) =>
  state.account.getAccountsStatus;

export const selectGetAccountStatus = (state) => state.account.getAccountStatus;

export const selectUpdateAccountStatus = (state) =>
  state.account.updateAccountStatus;

export const selectDeleteAccountStatus = (state) =>
  state.account.deleteAccountStatus;
