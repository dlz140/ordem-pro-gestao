import { supabase } from "@/integrations/supabase/client";
import { Marca } from "@/types";

export const fetchMarcas = async (): Promise<Marca[]> => {
  const { data, error } = await supabase
    .from('marcas')
    .select('id, marca')
    .order('marca', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const saveMarca = async (marcaData: Partial<Marca>): Promise<Marca> => {
  const { id, ...updateData } = marcaData;
  let response;
  if (id) {
    response = await supabase.from('marcas').update(updateData).eq('id', id).select().single();
  } else {
    response = await supabase.from('marcas').insert(updateData).select().single();
  }
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

export const deleteMarca = async (id: string): Promise<void> => {
  const { error } = await supabase.from('marcas').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error("Ação Bloqueada: Esta marca está sendo utilizada em produtos ou OS.");
    }
    throw new Error(error.message);
  }
};