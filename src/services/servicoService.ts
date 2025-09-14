import { supabase } from "@/integrations/supabase/client";
import { Servico } from "@/types";

export const fetchServicos = async (): Promise<Servico[]> => {
  const { data, error } = await supabase
    .from('servicos')
    .select('id, servico, valor')
    .order('servico', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const saveServico = async (servicoData: Partial<Servico>): Promise<Servico> => {
  const { id, ...updateData } = servicoData;
  const dadosParaBanco = {
    servico: updateData.servico,
    valor: updateData.valor || null,
  };

  let response;
  if (id) {
    response = await supabase.from('servicos').update(dadosParaBanco).eq('id', id).select().single();
  } else {
    response = await supabase.from('servicos').insert(dadosParaBanco).select().single();
  }
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

export const deleteServico = async (id: string): Promise<void> => {
  const { error } = await supabase.from('servicos').delete().eq('id', id);
  if (error) throw new Error(error.message);
};