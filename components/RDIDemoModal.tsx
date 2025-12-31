'use client';

import RDIDemo from './RDIDemo';

interface RDIDemoModalProps {
  onClose: () => void;
}

export default function RDIDemoModal({ onClose }: RDIDemoModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <RDIDemo />
      </div>
    </div>
  );
}
