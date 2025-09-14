import { supabase } from "@/integrations/supabase/client";
import { StatusOsInterface } from "@/types";

export async function fetchStatus(): Promise<StatusOsInterface[]> {
  const { data, error } = await supabase
    .from("status_sistema")
    .select("*")
    .order("status");

  if (error) {
    throw new Error("Não foi possível carregar os status.");
  }

  return data || [];
}

export async function saveStatus(status: Partial<StatusOsInterface>): Promise<StatusOsInterface> {
  const { id, ...updateData } = status;
  let response;

  if (id) {
    response = await supabase.from('status_sistema').update(updateData).eq('id', id).select().single();
  } else {
    response = await supabase.from('status_sistema').insert(updateData).select().single();
  }

  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
}

export async function deleteStatus(id: string): Promise<void> {
  const { error } = await supabase.from("status_sistema").delete().eq("id", id);

  if (error) {
    if (error.code === '23503') {
      throw new Error("Ação Bloqueada: Este status está sendo utilizado em Ordens de Serviço.");
    }
    throw new Error(error.message);
  }
}