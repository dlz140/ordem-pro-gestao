import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const horaStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    letterSpacing: '0.1rem',
    textAlign: 'right',
    background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', // Cores do logo OS Pro
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 5px rgba(139, 92, 246, 0.8)',
  };

  const dataStyle = {
    fontSize: '1rem',
    textAlign: 'right',
    color: 'hsl(var(--foreground) / 0.7)',
  };

  return (
    <div>
      <p style={horaStyle}>{format(time, 'HH:mm:ss')}</p>
      <p style={dataStyle}>
        {format(time, 'eeee, d \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
      </p>
    </div>
  );
}