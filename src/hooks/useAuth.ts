// src/hooks/useAuth.ts
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  // Log sempre que o hook for chamado
  if (context.user) {
    console.log("🎯 [useAuth] Hook chamado com usuário:", {
      id: context.user.id,
      nome: context.user.nome,
      login: context.user.login,
      id_perfil: context.user.id_perfil,
      perfil_descricao: context.user.perfil_descricao,
      id_estabelecimento: context.user.id_estabelecimento,
      nome_estabelecimento: context.user.nome_estabelecimento,
      id_restaurante: context.user.id_restaurante,
      nome_restaurante: context.user.nome_restaurante,
    });
  } else {
    console.log("🎯 [useAuth] Hook chamado SEM usuário");
  }

  return context;
};
