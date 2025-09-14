import { supabase } from "@/integrations/supabase/client";
import { Produto } from "@/types";

export const fetchProdutos = async (): Promise<Produto[]> => {
  const { data, error } = await supabase
    .from('produtos')
    .select(`*, marcas ( marca )`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Produto[]) || [];
};

export const saveProduto = async (produtoData: Partial<Produto>): Promise<Produto> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, marcas, ...updateData } = produtoData;
  const dadosParaBanco = {
    produto: updateData.produto,
    valor: updateData.valor || 0,
    novo: updateData.novo || false,
    usado: updateData.usado || false,
    marca_id: updateData.marca_id || null,
  };

  let response;
  if (id) {
    response = await supabase.from('produtos').update(dadosParaBanco).eq('id', id).select().single();
  } else {
    response = await supabase.from('produtos').insert([dadosParaBanco]).select().single();
  }
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

export const deleteProduto = async (id: string): Promise<void> => {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) throw new Error(error.message);
};