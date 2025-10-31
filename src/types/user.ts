// src/types/user.ts
export interface User {
  id: number;
  nome: string;
  login: string;
  email: string | null;
  id_perfil: number;
  id_restaurante: number | null;
  nome_restaurante: string | null;
  id_estabelecimento: number | null;
  nome_estabelecimento: string | null;
  id_empresa: number;
  alterou_senha: number;
  status: number;
  id_cadastro: number;
  data_cadastro: string;
  id_alteracao: number;
  data_alteracao: string;
  permissions: Permissions;
  perfil_descricao: string;
  id_grupo_permissoes?: number;
  token_expira_em: string;
}

export interface Permissions {
  v_liberacao_ticket?: string;
  ticket_leitura_restaurante?: string;
  c_liberacao_ticket?: string;
  e_liberacao_ticket?: string;
  v_ticket?: string;
  c_ticket?: string;
  e_ticket?: string;
  d_ticket?: string;
  v_estabelecimento?: string;
  v_funcionario?: string;
  c_funcionario?: string;
  e_funcionario?: string;
  v_restaurante_ticket?: string;
  c_restaurante_ticket?: string;
  e_restaurante_ticket?: string;
  aprovar_ticket?: string;
  ler_ticket?: string;
  aceitar_pedido?: string;
  v_relatorio?: string;
  v_faturamento?: string;
  e_faturamento?: string;
  v_nota_fiscal?: string;
  e_nota_fiscal?: string;
  conferencia_de_ticket?: string;
  [key: string]: string | undefined;
}

export interface AuthCredentials {
  identifier: string;
  senha: string;
}

export interface SignInCredentials {
  cpf: string;
  matricula: string;
}
