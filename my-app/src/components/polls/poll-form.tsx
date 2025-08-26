'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const pollSchema = z.object({
  question: z.string().min(5).max(100),
  options: z.array(z.string().min(2).max(100)).min(2).max(10),
})

export function PollForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(pollSchema),
  })

  const onSubmit = (data: z.infer<typeof pollSchema>) => {
    console.log(data)
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="question">Question</label>
          <input
            id="question"
            {...register("question")}
          />
          {errors.question && <p>{errors.question.message}</p>}
        </div>
        <div>
          <label htmlFor="options">Options</label>
          <input
            id="options"
            {...register("options")}
          />
          {errors.options && <p>{errors.options.message}</p>}
        </div>
        <button type="submit">Create Poll</button>
      </form>
    </div>
  )
}
