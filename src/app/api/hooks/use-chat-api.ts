import { useMutation } from "@tanstack/react-query";
import { chatService } from "../services";

export const useChatMutation = () =>
  useMutation({
    mutationFn: (question: string) => chatService.ask(question),
  });
