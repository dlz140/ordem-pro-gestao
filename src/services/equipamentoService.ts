import { supabase } from "@/integrations/supabase/client";
import { Equipamento } from "@/types";

export const fetchEquipamentos = async (): Promise<Equipamento[]> => {
  const { data, error } = await supabase
    .from('equipamentos')
    .select('id, tipo')
    .order('tipo', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const saveEquipamento = async (equipamentoData: Partial<Equipamento>): Promise<Equipamento> => {
  const { id, ...updateData } = equipamentoData;
  const dadosParaBanco = { tipo: updateData.tipo };

  let response;
  if (id) {
    response = await supabase.from('equipamentos').update(dadosParaBanco).eq('id', id).select().single();
  } else {
    response = await supabase.from('equipamentos').insert(dadosParaBanco).select().single();
  }
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

export const deleteEquipamento = async (id: string): Promise<void> => {
  const { error } = await supabase.from('equipamentos').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error("Ação Bloqueada: Este equipamento não pode ser removido pois está em uso.");
    }
    throw new Error(error.message);
  }
};