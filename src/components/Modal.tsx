import { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

type ModalProps = {
  children: ReactNode;
};

export default function Modal({ children }: ModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (typeof document === 'undefined') return null as any;
  return ReactDOM.createPortal(children, document.body);
}


