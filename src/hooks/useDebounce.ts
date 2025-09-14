import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  // Estado para armazenar o valor "atrasado" (debounced)
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Cria um temporizador que só vai atualizar o estado
    // depois que o 'delay' (atraso) passar.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Esta é a parte importante: se o `value` mudar (usuário digitou outra letra),
    // o useEffect é re-executado. A função de limpeza abaixo cancela o
    // temporizador anterior antes de criar um novo.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // O efeito só re-executa se o valor ou o delay mudarem

  return debouncedValue;
}