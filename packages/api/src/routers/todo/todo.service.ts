import prisma from "@neighborhood-incident-report/db";

import type { TodoCreateInput, TodoDeleteInput, TodoToggleInput } from "./_schemas";

export async function getAllTodos() {
  return await prisma.todo.findMany({
    orderBy: { id: "asc" },
  });
}

export async function createTodo(input: TodoCreateInput) {
  return await prisma.todo.create({
    data: { text: input.text },
  });
}

export async function toggleTodo(input: TodoToggleInput) {
  return await prisma.todo.update({
    where: { id: input.id },
    data: { completed: input.completed },
  });
}

export async function deleteTodo(input: TodoDeleteInput) {
  return await prisma.todo.delete({
    where: { id: input.id },
  });
}
