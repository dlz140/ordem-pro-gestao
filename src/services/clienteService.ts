import { supabase } from "@/integrations/supabase/client";
import { Cliente } from "@/types";

export const fetchClientes = async (searchTerm: string, filterPending: boolean, searchField: string): Promise<Cliente[]> => {
  const { data, error } = await supabase.rpc('search_clients', {
    search_term: searchTerm,
    filter_pending: filterPending,
    search_field: searchField,
  });

  if (error) {
     throw new Error("Não foi possível buscar os clientes.");
  }
  return data || [];
};

export const fetchClientesPendentesIds = async (): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('cliente_id')
    .in('status_id', 
      (await supabase.from('status_sistema').select('id').eq('eh_finalizado', false)).data?.map(s => s.id) || []
    );

  if (error) {
     throw new Error("Não foi possível carregar as pendências dos clientes.");
  }
  
  const ids = data?.map(item => item.cliente_id).filter((id): id is string => id !== null);
  return new Set(ids);
};

export const saveCliente = async (clienteData: Partial<Cliente>): Promise<Cliente> => {
  const { id, ...updateData } = clienteData;
  let response;

  if (id) {
    response = await supabase.from('clientes').update(updateData).eq('id', id).select().single();
  } else {
    response = await supabase.from('clientes').insert(updateData).select().single();
  }

  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

export const deleteCliente = async (id: string): Promise<void> => {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error("Ação bloqueada: Cliente possui ordens de serviço vinculadas.");
    }
    throw new Error(error.message);
  }
};