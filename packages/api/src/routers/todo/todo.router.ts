import { publicProcedure } from "../../index";
import { todoCreateSchema, todoDeleteSchema, todoToggleSchema } from "./_schemas";
import { createTodo, deleteTodo, getAllTodos, toggleTodo } from "./todo.service";

export const todoRouter = {
  getAll: publicProcedure.handler(async () => {
    return await getAllTodos();
  }),

  create: publicProcedure.input(todoCreateSchema).handler(async ({ input }) => {
    return await createTodo(input);
  }),

  toggle: publicProcedure.input(todoToggleSchema).handler(async ({ input }) => {
    return await toggleTodo(input);
  }),

  delete: publicProcedure.input(todoDeleteSchema).handler(async ({ input }) => {
    return await deleteTodo(input);
  }),
};
