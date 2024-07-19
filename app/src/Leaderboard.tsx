import useSWR from 'swr';

const apiUrl = import.meta.env.VITE_API_URL;

type Reaction = {
  name: string;
  count: number;
};

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then(
    (res) => res.json() as Promise<{ sortedReactions: Reaction[] }>,
  );

export function Leaderboard() {
  const { data } = useSWR(`${apiUrl}/leaderboard`, fetcher);
  return (
    <div>
      <div>leaderboard</div>
      <ol>
        {data?.sortedReactions.map((reaction) => (
          <li key={reaction.name}>
            {reaction.name.padEnd(10, ' ')} --- {reaction.count}
          </li>
        ))}
      </ol>
    </div>
  );
}
