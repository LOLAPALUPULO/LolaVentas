import React, { useState, useEffect, useRef } from 'react';
import { FeriaConfig, Sale, TipoPago, TipoUnidad } from '../types';
import { DIGITAL_PAYMENT_SOUND_BASE64, CASH_PAYMENT_SOUND_BASE64, PINTA_ADD_SOUND_BASE64, PINTA_SUB_SOUND_BASE64, LITRO_ADD_SOUND_BASE64, LITRO_SUB_SOUND_BASE64, UI_CLICK_SOUND_BASE64 } from '../constants';
import { localStorageService } from '../services/localStorageService';
import { ADMIN_USER_EMAIL } from '../constants';

interface SalesTPVProps {
    activeFeriaConfig: FeriaConfig | null;
    onAddSale: (sale: Sale) => void;
    onLogout: () => void;
}

export const SalesTPV: React.FC<SalesTPVProps> = ({ activeFeriaConfig, onAddSale, onLogout }) => {
    const [pintaCount, setPintaCount] = useState(0);
    const [litroCount, setLitroCount] = useState(0);
    const [activeButton, setActiveButton] = useState<string | null>(null); 
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingOrders, setPendingOrders] = useState<Sale[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    const digitalSoundRef = useRef(new Audio(DIGITAL_PAYMENT_SOUND_BASE64));
    const billeteSoundRef = useRef(new Audio(CASH_PAYMENT_SOUND_BASE64));
    const pintaAddSoundRef = useRef(new Audio(PINTA_ADD_SOUND_BASE64));
    const pintaSubSoundRef = useRef(new Audio(PINTA_SUB_SOUND_BASE64));
    const litroAddSoundRef = useRef(new Audio(LITRO_ADD_SOUND_BASE64));
    const litroSubSoundRef = useRef(new Audio(LITRO_SUB_SOUND_BASE64));
    const uiClickSoundRef = useRef(new Audio(UI_CLICK_SOUND_BASE64));

    useEffect(() => {
      const storedPending = localStorageService.getPendingOrders();
      if (storedPending.length > 0) setPendingOrders(storedPending);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
