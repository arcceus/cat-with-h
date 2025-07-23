'use client';
import { redirect } from "next/navigation";

// import { useChat } from 'ai/react';

export default function Page() {

  redirect('/workspace')
  // const { messages, input, handleInputChange, handleSubmit } = useChat({});
  // console.log(messages)

  // return (
  //   <>
  //     {messages.map(message => (
  //       <div key={message.id}>
  //         {message.role === 'user' ? 'User: ' : 'AI: '}
  //         {message.content}
  //       </div>
  //     ))}

  //     <form onSubmit={handleSubmit}>
  //       <input name="prompt" value={input} onChange={handleInputChange} />
  //       <button type="submit">Submit</button>
  //     </form>
  //   </>
  // );
  return null;
}