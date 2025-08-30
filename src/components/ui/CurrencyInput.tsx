import { useState, useEffect, KeyboardEventHandler, forwardRef } from 'react';
import { Input, InputProps } from '@/components/ui/input';

// Omitimos as props que vamos controlar para evitar conflitos
export interface CurrencyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'onKeyDown'> {
  /**
   * O valor do campo em sua unidade base (ex: 19.99 para R$ 19,99).
   */
  value?: number | null;
  /**
   * Callback chamado quando o valor muda. Retorna o valor na unidade base ou undefined se o campo for zerado.
   */
  onValueChange: (value: number | undefined) => void;
}

/**
 * Formata um valor numérico (em centavos) para uma string de moeda BRL.
 * @param valueInCents - O valor em centavos (ex: 1999 para R$ 19,99).
 */
const formatToBRL = (valueInCents: number) => {
  const valueInReais = valueInCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInReais);
};

/**
 * Um componente de input que se comporta como um caixa eletrônico para entrada de valores monetários.
 * Ele gerencia internamente o valor em centavos para evitar problemas de precisão com ponto flutuante.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    // Estado interno que sempre armazena o valor em centavos como um inteiro.
    const [cents, setCents] = useState(() => Math.round((value ?? 0) * 100));

    // Efeito para sincronizar o estado interno caso o valor externo (prop) mude.
    // Essencial para carregar dados existentes em um formulário de edição.
    useEffect(() => {
      setCents(Math.round((value ?? 0) * 100));
    }, [value]);

    const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
      const { key } = e;

      // Se a tecla pressionada for um número, adiciona ao final do valor.
      if (/^\d$/.test(key)) {
        e.preventDefault();
        setCents((prev) => {
          const newCents = prev * 10 + Number(key);
          // Limita o valor para evitar overflow com números muito grandes.
          if (newCents > Number.MAX_SAFE_INTEGER) return prev;
          onValueChange(newCents / 100);
          return newCents;
        });
        return;
      }

      // Se for "Backspace", remove o último dígito.
      if (key === 'Backspace') {
        e.preventDefault();
        setCents((prev) => {
          const newCents = Math.floor(prev / 10);
          // Se o valor se tornar zero, chama onValueChange com `undefined`.
          // Isso permite ao componente pai tratar o campo como "vazio".
          onValueChange(newCents > 0 ? newCents / 100 : undefined);
          return newCents;
        });
        return;
      }

      // Permite teclas de navegação e atalhos (Ctrl+C, etc.), mas bloqueia outras.
      const allowedKeys = ['Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!allowedKeys.includes(key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    };

    return (
      <Input
        value={formatToBRL(cents)}
        onKeyDown={handleKeyDown}
        placeholder="R$ 0,00"
        className="text-left" // Garante alinhamento padrão
        ref={ref}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';