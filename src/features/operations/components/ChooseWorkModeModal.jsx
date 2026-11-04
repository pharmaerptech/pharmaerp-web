import React from "react";
import { UIModal } from "@/components/ui";
import { useWorkMode } from "@/contexts";
import ChooseWorkModeView from "./ChooseWorkModeView";

export const ChooseWorkModeModal = ({ isOpen, onClose }) => {
  const { isModeModalOpen, closeModeModal } = useWorkMode();

  const show = isOpen !== undefined ? isOpen : isModeModalOpen;
  const handleClose = onClose || closeModeModal;

  return (
    <UIModal
      isOpen={show}
      onClose={handleClose}
      size="2xl"
      showCloseButton={true}
      className="p-0 overflow-hidden bg-bg border border-border/80 rounded-2xl max-w-5xl"
    >
      <div className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <ChooseWorkModeView onSelectMode={handleClose} isModal={true} />
      </div>
    </UIModal>
  );
};

export default ChooseWorkModeModal;

