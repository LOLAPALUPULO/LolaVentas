import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { format, parseISO, isValid } from 'date-fns';

// --- Global Constants ---
const ADMIN_USER = 'regis';
const SALES_USER = 'lol';

const FIRESTORE_COLLECTIONS = {
  FAIRS: 'fairs',
  SALES: 'sales',
};

// --- Types (simplified for JavaScript runtime, JSDoc for documentation) ---
/**
 * @typedef {('admin'|'sales')} UserRole
 */
const UserRole = {
  Admin: 'admin',
  Sales: 'sales',
};

/**
 * @typedef {Object} FirebaseTimestamp
 * @property {function(): Date} toDate
 * @property {number} seconds
 * @property {number} nanoseconds
 */

/**
 * @typedef {Object} Fair
 * @property {string} id
 * @property {string} name
 * @property {string} startDate - ISO date string 'YYYY-MM-DD'
 * @property {string} endDate - ISO date string 'YYYY-MM-DD'
 * @property {number} pintaValue
 * @property {number} literValue
 * @property {boolean} isActive
 */

/**
 * @typedef {('Pinta'|'Litro')} UnitType
 */
const UnitType = {
  Pinta: 'Pinta',
  Litro: 'Litro',
};

/**
 * @typedef {('$ Digital'|'$ Billete')} PaymentType
 */
const PaymentType = {
  Digital: '$ Digital',
  Billete: '$ Billete',
};

/**
 * @typedef {Object} Sale
 * @property {string} [id] - Optional for new sales before saving
 * @property {string} fairId
 * @property {FirebaseTimestamp} saleDate
 * @property {UnitType} unitType
 * @property {number} quantity
 * @property {number} totalAmount
 * @property {PaymentType} paymentType
 * @property {string} userName
 */


// --- Firebase Service ---
// Declare firebase globally as it's loaded via CDN script
declare const firebase: any;

// Initialize Firebase (replace with your project's config)
const firebaseConfig = {
  projectId: 'lolaventas-5a9fa',
};

// Check if Firebase is already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

/**
 * Adds a new fair to Firestore, deactivating any currently active fair.
 * @param {Omit<Fair, 'id' | 'isActive'>} fairData
 * @returns {Promise<Fair>}
 */
const addFair = async (fairData) => {
  // First, deactivate any existing active fair
  const activeFairQuery = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).where('isActive', '==', true).get();
  const batch = db.batch();
  activeFairQuery.forEach((doc) => {
    batch.update(doc.ref, { isActive: false });
  });

  // Add the new fair as active
  const docRef = db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc();
  const newFair = { ...fairData, id: docRef.id, isActive: true };
  batch.set(docRef, newFair);
  await batch.commit();
  return newFair;
};

/**
 * Updates an existing fair in Firestore.
 * @param {string} fairId
 * @param {Partial<Fair>} updates
 * @returns {Promise<void>}
 */
const updateFair = async (fairId, updates) => {
  await db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc(fairId).update(updates);
};

/**
 * Retrieves a fair by its ID.
 * @param {string} fairId
 * @returns {Promise<Fair | null>}
 */
const getFairById = async (fairId) => {
  const doc = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc(fairId).get();
  if (doc.exists) {
    return { id: doc.id, ...doc.data() };
  }
  return null;
};

/**
 * Retrieves the currently active fair from Firestore.
 * @returns {Promise<Fair | null>}
 */
const getActiveFair = async () => {
  const snapshot = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).where('isActive', '==', true).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  return null;
};

/**
 * Retrieves all fairs from Firestore, ordered by start date.
 * @returns {Promise<Fair[]>}
 */
const getFairs = async () => {
  const snapshot = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).orderBy('startDate', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Adds a new sale record to Firestore.
 * @param {Omit<Sale, 'id'>} saleData
 * @returns {Promise<Sale>}
 */
const addSale = async (saleData) => {
  const docRef = await db.collection(FIRESTORE_COLLECTIONS.SALES).add({
    ...saleData,
    saleDate: firebase.firestore.FieldValue.serverTimestamp(), // Use server timestamp
  });
  const doc = await docRef.get(); // Fetch the created document to get the actual timestamp
  return { id: doc.id, ...doc.data() };
};

/**
 * Retrieves all sales for a given fair ID.
 * @param {string} fairId
 * @returns {Promise<Sale[]>}
 */
const getSalesForFair = async (fairId) => {
  const snapshot = await db.collection(FIRESTORE_COLLECTIONS.SALES)
    .where('fairId', '==', fairId)
    .orderBy('saleDate', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Sets the isActive status of a fair to false, effectively closing its sales.
 * @param {string} fairId
 * @returns {Promise<void>}
 */
const closeFairSales = async (fairId) => {
    await db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc(fairId).update({ isActive: false });
};


// --- Audio Utils ---
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

/**
 * Plays a short beep sound.
 * @param {number} frequency - The frequency of the beep in Hz.
 * @param {number} duration - The duration of the beep in milliseconds.
 */
const playBeep = (frequency, duration = 100) => {
  const context = getAudioContext();
  if (!context) {
    console.warn("AudioContext not available.");
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.type = 'sine'; // Sine wave for a clean beep
  oscillator.frequency.setValueAtTime(frequency, context.currentTime); // Set frequency
  gainNode.gain.setValueAtTime(0.5, context.currentTime); // Start at 50% volume

  oscillator.start(context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + duration / 1000); // Fade out
  oscillator.stop(context.currentTime + duration / 1000); // Stop after duration
};


// --- PDF Generator Utils ---
/**
 * @typedef {Object} ReportData
 * @property {string} fairName
 * @property {string} startDate
 * @property {string} endDate
 * @property {number} totalPintas
 * @property {number} totalLitros
 * @property {number} totalRecaudado
 * @property {number} totalDigital
 * @property {number} totalBillete
 * @property {Array<Object>} sales
 * @property {string} sales[].date
 * @property {string} sales[].type
 * @property {number} sales[].quantity
 * @property {number} sales[].amount
 * @property {string} sales[].payment
 * @property {string} sales[].user
 */

/**
 * Generates a PDF report from fair sales data.
 * Assumes jspdf and html2canvas are loaded globally.
 * @param {ReportData} data
 */
const generateReportPdf = (data) => {
  const { jsPDF } = window.jspdf; // Access jspdf from window
  const doc = new jsPDF();
  let yPos = 20;
  const margin = 15;
  const lineHeight = 7;

  doc.setFontSize(22);
  doc.text(`Reporte de Feria: ${data.fairName}`, margin, yPos);
  yPos += lineHeight * 2;

  doc.setFontSize(12);
  doc.text(`Fechas: ${data.startDate} - ${data.endDate}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Total Pintas Vendidas: ${data.totalPintas}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Total Litros Vendidos: ${data.totalLitros}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Monto Total Recaudado: $${data.totalRecaudado.toFixed(2)}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - $ Digital: $${data.totalDigital.toFixed(2)}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - $ Billete: $${data.totalBillete.toFixed(2)}`, margin, yPos);
  yPos += lineHeight * 2;

  doc.setFontSize(16);
  doc.text("Detalle de Ventas:", margin, yPos);
  yPos += lineHeight * 1.5;

  const headers = ['Fecha', 'Tipo Unidad', 'Cantidad', 'Monto', 'Pago', 'Usuario'];
  const tableData = data.sales.map(sale => [
    sale.date,
    sale.type,
    sale.quantity.toString(),
    `$${sale.amount.toFixed(2)}`,
    sale.payment,
    sale.user
  ]);

  // @ts-ignore - autoTable is a plugin, context-aware type checking is hard in raw JS/JSX
  doc.autoTable({
    startY: yPos,
    head: [headers],
    body: tableData,
    margin: { horizontal: margin },
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    theme: 'grid',
  });

  doc.save(`reporte-${data.fairName.replace(/\s/g, '_')}.pdf`);
};


// --- WhatsApp Utils ---
/**
 * Shares a message on WhatsApp.
 * @param {string} message
 */
const shareOnWhatsApp = (message) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};


// --- Components ---

const AuthScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleLoginAttempt = (role) => {
    if (username.toLowerCase() === ADMIN_USER && role === 'admin') {
      onLogin(username.toLowerCase());
    } else if (username.toLowerCase() === SALES_USER && role === 'sales') {
      onLogin(username.toLowerCase());
    } else {
      setError('Usuario o rol incorrecto.');
    }
  };

  const isButtonEnabled = username.toLowerCase() === ADMIN_USER || username.toLowerCase() === SALES_USER;

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 min-h-[70vh]">
      <h1 className="text-6xl sm:text-7xl md:text-8xl font-pitched-battle text-blue-700 mb-8 sm:mb-10">LOLA VENTA</h1>
      <div className="w-full max-w-sm">
        <input
          type="text"
          placeholder="USUARIO"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(''); // Clear error on input change
          }}
          className="w-full p-4 border border-gray-300 rounded-lg text-center text-xl sm:text-2xl mb-6 focus:ring-2 focus:ring-blue-400 outline-none transition duration-200"
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => handleLoginAttempt('admin')}
            disabled={!isButtonEnabled || username.toLowerCase() !== ADMIN_USER}
            className={`w-full py-4 text-white text-xl sm:text-2xl rounded-lg font-bold transition duration-200
              ${isButtonEnabled && username.toLowerCase() === ADMIN_USER
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-400 cursor-not-allowed'}`}
          >
            INGRESAR ADMINISTRADOR
          </button>
          <button
            onClick={() => handleLoginAttempt('sales')}
            disabled={!isButtonEnabled || username.toLowerCase() !== SALES_USER}
            className={`w-full py-4 text-white text-xl sm:text-2xl rounded-lg font-bold transition duration-200
              ${isButtonEnabled && username.toLowerCase() === SALES_USER
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                : 'bg-gray-400 cursor-not-allowed'}`}
          >
            INGRESAR VENTA
          </button>
        </div>
      </div>
    </div>
  );
};


const FairConfigForm = ({ activeFair, onFairConfigured }) => {
  const [fairName, setFairName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pintaValue, setPintaValue] = useState(0);
  const [literValue, setLiterValue] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeFair) {
      setFairName(activeFair.name);
      setStartDate(activeFair.startDate);
      setEndDate(activeFair.endDate);
      setPintaValue(activeFair.pintaValue);
      setLiterValue(activeFair.literValue);
    } else {
      // Clear form for new fair if no active fair
      setFairName('');
      setStartDate('');
      setEndDate('');
      setPintaValue(0);
      setLiterValue(0);
    }
    setMessage({ text: '', type: '' });
  }, [activeFair]);

  const validateForm = () => {
    if (!fairName.trim() || !startDate || !endDate || pintaValue <= 0 || literValue <= 0) {
      setMessage({ text: 'Por favor, completa todos los campos y asegúrate de que los valores sean mayores que cero.', type: 'error' });
      return false;
    }
    if (!isValid(parseISO(startDate)) || !isValid(parseISO(endDate))) {
      setMessage({ text: 'Fechas inválidas. Por favor, usa el formato correcto.', type: 'error' });
      return false;
    }
    if (parseISO(startDate) > parseISO(endDate)) {
      setMessage({ text: 'La fecha de inicio no puede ser posterior a la fecha de fin.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    const fairData = {
      name: fairName,
      startDate,
      endDate,
      pintaValue,
      literValue,
    };

    try {
      if (activeFair) {
        await updateFair(activeFair.id, fairData);
        const updatedFair = { ...activeFair, ...fairData };
        onFairConfigured(updatedFair);
        setMessage({ text: 'Feria actualizada con éxito.', type: 'success' });
      } else {
        const newFair = await addFair(fairData);
        onFairConfigured(newFair);
        setMessage({ text: 'Nueva feria configurada con éxito.', type: 'success' });
        // Reset form for a completely new fair creation experience after successful save
        setFairName('');
        setStartDate('');
        setEndDate('');
        setPintaValue(0);
        setLiterValue(0);
      }
    } catch (error) {
      console.error("Error al guardar la feria:", error);
      setMessage({ text: `Error al guardar la feria: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000); // Clear message after 5 seconds
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-pitched-battle text-gray-800 mb-6 border-b pb-2">
        {activeFair ? 'Configurar Feria Actual' : 'Generar Nueva Feria'}
      </h2>

      {activeFair && (
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold text-xl mb-1">Feria Activa:</p>
          <p className="text-lg">{activeFair.name}</p>
          <p>
            Fechas: {format(parseISO(activeFair.startDate), 'dd/MM/yyyy')} - {format(parseISO(activeFair.endDate), 'dd/MM/yyyy')}
          </p>
          <p>Valor Pinta: ${activeFair.pintaValue}</p>
          <p>Valor Litro: ${activeFair.literValue}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fairName" className="block text-lg font-medium text-gray-700 mb-2">
            NOMBRE DE LA FERIA
          </label>
          <input
            type="text"
            id="fairName"
            value={fairName}
            onChange={(e) => setFairName(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-lg font-medium text-gray-700 mb-2">
              FECHA INICIO
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-lg font-medium text-gray-700 mb-2">
              FECHA FIN
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pintaValue" className="block text-lg font-medium text-gray-700 mb-2">
              VALOR PINTA
            </label>
            <input
              type="number"
              id="pintaValue"
              value={pintaValue}
              onChange={(e) => setPintaValue(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="literValue" className="block text-lg font-medium text-gray-700 mb-2">
              VALOR LITRO
            </label>
            <input
              type="number"
              id="literValue"
              value={literValue}
              onChange={(e) => setLiterValue(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
        </div>

        {message.text && (
          <div
            className={`p-3 rounded-md text-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : (activeFair ? 'Actualizar Feria' : 'Guardar Nueva Feria')}
        </button>
      </form>
    </div>
  );
};


const ActiveFairReport = ({ fair, onFairClosed, initialSales, hideCloseButton = false, isLoadingSales = false }) => {
  const [sales, setSales] = useState(initialSales || []);
  const [loading, setLoading] = useState(!initialSales && fair.isActive);
  const [isClosing, setIsClosing] = useState(false);
  const [closeMessage, setCloseMessage] = useState('');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSales = await getSalesForFair(fair.id);
      setSales(fetchedSales);
    } catch (error) {
      console.error("Error fetching sales for fair:", error);
      // Handle error display
    } finally {
      setLoading(false);
    }
  }, [fair.id]);

  useEffect(() => {
    if (!initialSales && fair.isActive) { // Only fetch if not provided and fair is active
      fetchSales();
    } else if (initialSales) {
      setSales(initialSales); // Use provided initial sales for historical
      setLoading(false); // If initialSales provided, we are not loading
    }
  }, [fair.id, initialSales, fair.isActive, fetchSales]); // Added fetchSales to dependency array

  // Recalculate totals whenever sales change
  const {
    totalPintas,
    totalLitros,
    totalDigital,
    totalBillete,
    totalRecaudado
  } = useMemo(() => {
    let pintas = 0;
    let litros = 0;
    let digital = 0;
    let billete = 0;

    sales.forEach(sale => {
      if (sale.unitType === UnitType.Pinta) {
        pintas += sale.quantity;
      } else if (sale.unitType === UnitType.Litro) {
        litros += sale.quantity;
      }

      if (sale.paymentType === PaymentType.Digital) {
        digital += sale.totalAmount;
      } else if (sale.paymentType === PaymentType.Billete) {
        billete += sale.totalAmount;
      }
    });

    return {
      totalPintas: pintas,
      totalLitros: litros,
      totalDigital: digital,
      totalBillete: billete,
      totalRecaudado: digital + billete
    };
  }, [sales]);

  const handleCloseFair = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cerrar las ventas de esta feria? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsClosing(true);
    setCloseMessage('');
    try {
      await closeFairSales(fair.id);
      onFairClosed(null); // Notify parent to clear active fair
      setCloseMessage('Ventas de la feria cerradas con éxito.');
    } catch (error) {
      console.error("Error al cerrar las ventas de la feria:", error);
      setCloseMessage(`Error al cerrar las ventas: ${error.message}`);
    } finally {
      setIsClosing(false);
      setTimeout(() => setCloseMessage(''), 5000); // Clear message after 5 seconds
    }
  };

  const reportData = useMemo(() => {
    return {
      fairName: fair.name,
      startDate: format(parseISO(fair.startDate), 'dd/MM/yyyy'),
      endDate: format(parseISO(fair.endDate), 'dd/MM/yyyy'),
      totalPintas,
      totalLitros,
      totalRecaudado,
      totalDigital,
      totalBillete,
      sales: sales.map(s => ({
        date: format(s.saleDate.toDate(), 'dd/MM/yyyy HH:mm'),
        type: s.unitType,
        quantity: s.quantity,
        amount: s.totalAmount,
        payment: s.paymentType,
        user: s.userName
      }))
    };
  }, [fair, totalPintas, totalLitros, totalRecaudado, totalDigital, totalBillete, sales]);

  const handleDownloadPdf = () => {
    generateReportPdf(reportData);
  };

  const handleShareWhatsApp = () => {
    const message = `*Reporte de Feria: ${fair.name}*\n` +
                    `Fechas: ${reportData.startDate} - ${reportData.endDate}\n\n` +
                    `Total Pintas vendidas: ${reportData.totalPintas}\n` +
                    `Total Litros vendidos: ${reportData.totalLitros}\n\n` +
                    `*Monto Total Recaudado: $${reportData.totalRecaudado.toFixed(2)}*\n` +
                    `  - $ Digital: $${reportData.totalDigital.toFixed(2)}\n` +
                    `  - $ Billete: $${reportData.totalBillete.toFixed(2)}\n\n` +
                    `¡Consulta el reporte completo en PDF para más detalles!`;
    shareOnWhatsApp(message);
  };

  if (loading || isLoadingSales) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl">Cargando reporte de ventas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-pitched-battle text-gray-800 mb-6 border-b pb-2">Reporte de Feria: {fair.name}</h2>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
        <p className="font-semibold">Fechas: <span className="font-normal">{format(parseISO(fair.startDate), 'dd/MM/yyyy')} - {format(parseISO(fair.endDate), 'dd/MM/yyyy')}</span></p>
        <p className="font-semibold">Valor Pinta: <span className="font-normal">${fair.pintaValue.toFixed(2)}</span></p>
        <p className="font-semibold">Valor Litro: <span className="font-normal">${fair.literValue.toFixed(2)}</span></p>
        <p className="font-semibold">Estado: <span className={`font-normal ${fair.isActive ? 'text-green-600' : 'text-red-600'}`}>{fair.isActive ? 'Activa' : 'Cerrada'}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800">Pintas Vendidas</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{totalPintas}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
          <h3 className="text-xl font-semibold text-green-800">Litros Vendidos</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">{totalLitros}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
          <h3 className="text-xl font-semibold text-purple-800">Total Recaudado</h3>
          <p className="text-4xl font-bold text-purple-600 mt-2">${totalRecaudado.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Detalle por Tipo de Pago</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
            <p className="text-lg font-medium text-gray-700">Digital:</p>
            <p className="text-3xl font-bold text-blue-500 mt-1">${totalDigital.toFixed(2)}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
            <p className="text-lg font-medium text-gray-700">Billete:</p>
            <p className="text-3xl font-bold text-green-500 mt-1">${totalBillete.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={handleDownloadPdf}
          className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Descargar Reporte (PDF)
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Compartir Reporte (WhatsApp)
        </button>
      </div>

      {fair.isActive && !hideCloseButton && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleCloseFair}
            disabled={isClosing}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClosing ? 'Cerrando Ventas...' : 'Cerrar Ventas de la Feria'}
          </button>
          {closeMessage && (
            <p className={`mt-4 text-center text-lg ${closeMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {closeMessage}
            </p>
          )}
        </div>
      )}

      {sales.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Detalle de Ventas ({sales.length} transacciones)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Tipo Unidad</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Cantidad</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Monto</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Pago</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{format(sale.saleDate.toDate(), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.unitType}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.quantity}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">${sale.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.paymentType}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


const AdminDashboard = ({ activeFair, onFairUpdate }) => {
  const [currentView, setCurrentView] = useState(AdminView.Config);
  const [fairHistory, setFairHistory] = useState([]);
  const [selectedHistoricalFair, setSelectedHistoricalFair] = useState(null);
  const [historicalSales, setHistoricalSales] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const fetchFairHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const fairs = await getFairs();
      setFairHistory(fairs.filter(f => f.id !== activeFair?.id)); // Exclude active fair from history
    } catch (error) {
      console.error("Error fetching fair history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeFair?.id]);

  useEffect(() => {
    fetchFairHistory();
  }, [fetchFairHistory, activeFair]); // Re-fetch history if activeFair changes

  const handleSelectHistoricalFair = useCallback(async (fair) => {
    setSelectedHistoricalFair(fair);
    setIsLoadingSales(true);
    try {
      const sales = await getSalesForFair(fair.id);
      setHistoricalSales(sales);
    } catch (error) {
      console.error("Error fetching historical sales:", error);
    } finally {
      setIsLoadingSales(false);
    }
  }, []);

  const clearSelectedHistoricalFair = useCallback(() => {
    setSelectedHistoricalFair(null);
    setHistoricalSales([]);
  }, []);

  return (
    <div className="flex flex-col">
      <nav className="mb-6 flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 p-4 bg-gray-50 rounded-lg shadow-inner">
        {Object.values(AdminView).map((view) => (
          <button
            key={view}
            onClick={() => {
              setCurrentView(view);
              clearSelectedHistoricalFair(); // Clear history selection when changing view
            }}
            className={`px-4 py-2 rounded-lg text-lg font-semibold transition duration-200 ease-in-out
              ${currentView === view
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {view}
          </button>
        ))}
      </nav>

      <div className="bg-white p-6 rounded-lg shadow-md min-h-[50vh]">
        {currentView === AdminView.Config && (
          <FairConfigForm activeFair={activeFair} onFairConfigured={onFairUpdate} />
        )}

        {currentView === AdminView.ActiveReport && (
          activeFair ? (
            <ActiveFairReport fair={activeFair} onFairClosed={onFairUpdate} />
          ) : (
            <div className="text-center text-xl text-gray-600 p-8 bg-yellow-50 rounded-lg">
              No hay una feria activa para mostrar el reporte. Por favor, configura una nueva feria.
            </div>
          )
        )}

        {currentView === AdminView.History && (
          <div>
            <h2 className="text-3xl font-pitched-battle text-gray-800 mb-6 border-b pb-2">Historial de Ferias</h2>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center text-blue-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                Cargando historial de ferias...
              </div>
            ) : fairHistory.length === 0 ? (
              <p className="text-gray-600 text-center text-lg">No hay ferias en el historial.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fairHistory.map((fair) => (
                  <button
                    key={fair.id}
                    onClick={() => handleSelectHistoricalFair(fair)}
                    className={`block w-full text-left p-4 rounded-lg shadow-sm border
                      ${selectedHistoricalFair?.id === fair.id
                        ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                      } transition duration-200`}
                  >
                    <h3 className="text-xl font-semibold text-gray-800">{fair.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(fair.startDate), 'dd/MM/yyyy')} - {format(new Date(fair.endDate), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">ID: {fair.id.substring(0, 8)}...</p>
                  </button>
                ))}
              </div>
            )}

            {selectedHistoricalFair && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-pitched-battle text-gray-800 mb-4">Reporte de Feria Histórica: {selectedHistoricalFair.name}</h3>
                <button
                  onClick={clearSelectedHistoricalFair}
                  className="mb-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition duration-200"
                >
                  &larr; Volver al Historial
                </button>
                <ActiveFairReport fair={selectedHistoricalFair} initialSales={historicalSales} onFairClosed={onFairUpdate} hideCloseButton={true} isLoadingSales={isLoadingSales} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminView = {
  Config: 'Configurar Feria',
  ActiveReport: 'Reporte de Feria Activa',
  History: 'Historial de Ferias',
};


const SalesPOS = ({ activeFair, onFairUpdate }) => {
  const [pintaCount, setPintaCount] = useState(0);
  const [literCount, setLiterCount] = useState(0);
  const [partialTotal, setPartialTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const total = (pintaCount * activeFair.pintaValue) + (literCount * activeFair.literValue);
    setPartialTotal(total);
  }, [pintaCount, literCount, activeFair.pintaValue, activeFair.literValue]);

  const handleUnitIncrement = (unit) => {
    if (unit === UnitType.Pinta) {
      setPintaCount(prev => prev + 1);
    } else {
      setLiterCount(prev => prev + 1);
    }
  };

  const handleUnitDecrement = (unit) => {
    if (unit === UnitType.Pinta && pintaCount > 0) {
      setPintaCount(prev => prev - 1);
    } else if (unit === UnitType.Litro && literCount > 0) {
      setLiterCount(prev => prev - 1);
    }
  };

  const resetCounters = useCallback(() => {
    setPintaCount(0);
    setLiterCount(0);
    setPartialTotal(0);
  }, []);

  const handlePayment = async (paymentType) => {
    if (partialTotal <= 0 || (pintaCount === 0 && literCount === 0)) {
      setMessage('No hay ventas para registrar.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    setMessage('');
    try {
      if (paymentType === PaymentType.Digital) {
        playBeep(440, 100); // Beep for Digital
      } else {
        playBeep(660, 100); // Higher beep for Billete
      }

      const salesToRecord = [];
      if (pintaCount > 0) {
        salesToRecord.push({
          fairId: activeFair.id,
          unitType: UnitType.Pinta,
          quantity: pintaCount,
          totalAmount: pintaCount * activeFair.pintaValue,
          paymentType,
          userName: SALES_USER,
        });
      }
      if (literCount > 0) {
        salesToRecord.push({
          fairId: activeFair.id,
          unitType: UnitType.Litro,
          quantity: literCount,
          totalAmount: literCount * activeFair.literValue,
          paymentType,
          userName: SALES_USER,
        });
      }

      // Record each item as a separate sale for detailed tracking
      // Or combine into one sale if preferred, depends on exact data granularity needed
      await Promise.all(salesToRecord.map(sale => addSale(sale)));

      setMessage('CARGADO');
      resetCounters();
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-white rounded-lg shadow-md min-h-[70vh]">
      <h2 className="text-4xl font-pitched-battle text-gray-800 mb-6 border-b pb-2 w-full text-center">
        Punto de Venta: {activeFair.name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
        {/* Product Buttons */}
        <div className="col-span-1 bg-blue-50 p-6 rounded-lg shadow-inner flex flex-col justify-between items-center text-center">
          <h3 className="text-2xl font-semibold text-blue-800 mb-4">VENTA PINTA</h3>
          <p className="text-6xl font-bold text-blue-600 mb-4">{pintaCount}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => handleUnitDecrement(UnitType.Pinta)}
              disabled={pintaCount === 0 || isProcessing}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <button
              onClick={() => handleUnitIncrement(UnitType.Pinta)}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <p className="mt-4 text-xl text-gray-700">($ {activeFair.pintaValue.toFixed(2)} c/u)</p>
        </div>

        <div className="col-span-1 bg-green-50 p-6 rounded-lg shadow-inner flex flex-col justify-between items-center text-center">
          <h3 className="text-2xl font-semibold text-green-800 mb-4">VENTA LITRO</h3>
          <p className="text-6xl font-bold text-green-600 mb-4">{literCount}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => handleUnitDecrement(UnitType.Litro)}
              disabled={literCount === 0 || isProcessing}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <button
              onClick={() => handleUnitIncrement(UnitType.Litro)}
              disabled={isProcessing}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <p className="mt-4 text-xl text-gray-700">($ {activeFair.literValue.toFixed(2)} c/u)</p>
        </div>
      </div>

      {/* Partial Total and Payment Buttons */}
      <div className="w-full max-w-2xl bg-purple-50 p-6 rounded-lg shadow-lg text-center mb-8">
        <h3 className="text-2xl font-semibold text-purple-800">CÁLCULO PARCIAL</h3>
        <p className="text-6xl font-bold text-purple-600 mt-2">$ {partialTotal.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => handlePayment(PaymentType.Digital)}
          disabled={isProcessing || partialTotal === 0}
          className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white text-3xl font-bold rounded-lg shadow-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          $ DIGITAL
        </button>
        <button
          onClick={() => handlePayment(PaymentType.Billete)}
          disabled={isProcessing || partialTotal === 0}
          className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-white text-3xl font-bold rounded-lg shadow-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          $ BILLETE
        </button>
      </div>

      {message && (
        <div className={`mt-8 px-6 py-3 rounded-lg text-2xl font-bold ${message === 'CARGADO' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message}
        </div>
      )}
    </div>
  );
};


// --- App Component (main) ---
const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeFair, setActiveFair] = useState(null);
  const [isLoadingFair, setIsLoadingFair] = useState(true);

  useEffect(() => {
    const fetchActiveFair = async () => {
      setIsLoadingFair(true);
      try {
        const fair = await getActiveFair();
        setActiveFair(fair);
      } catch (error) {
        console.error("Error fetching active fair:", error);
      } finally {
        setIsLoadingFair(false);
      }
    };
    fetchActiveFair();
  }, []);

  const handleLogin = (username) => {
    setLoggedInUser(username);
    if (username === ADMIN_USER) {
      setUserRole(UserRole.Admin);
    } else if (username === SALES_USER) {
      setUserRole(UserRole.Sales);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUserRole(null);
  };

  const handleFairUpdate = (fair) => {
    setActiveFair(fair);
  };

  if (loggedInUser === null) {
    return (
      <AuthScreen onLogin={handleLogin} />
    );
  }

  if (isLoadingFair) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-700">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl">Cargando datos de la feria...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <header className="mb-6 py-4 bg-blue-600 text-white rounded-t-lg shadow-md flex justify-between items-center px-6">
        <h1 className="text-4xl font-pitched-battle tracking-wide">LOLA VENTA</h1>
        <div className="flex items-center space-x-4">
          <span className="text-lg">Usuario: {loggedInUser}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="min-h-[70vh]">
        {userRole === UserRole.Admin && (
          <AdminDashboard activeFair={activeFair} onFairUpdate={handleFairUpdate} />
        )}
        {userRole === UserRole.Sales && activeFair && (
          <SalesPOS activeFair={activeFair} onFairUpdate={handleFairUpdate} />
        )}
        {userRole === UserRole.Sales && !activeFair && (
          <div className="text-center text-red-600 text-2xl mt-12 p-6 bg-red-100 rounded-lg shadow-inner">
            <p>¡Atención! No hay una feria activa configurada.</p>
            <p className="text-lg mt-2">Por favor, espera a que el administrador configure una feria.</p>
          </div>
        )}
      </main>
    </div>
  );
};


// --- ReactDOM Render (entry point) ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);