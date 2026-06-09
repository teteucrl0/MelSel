export default function ProducerStoryCard({ icon, name, region, specialty, story }) {
  return (
    <article className="shop-producer-card">
      <div className="shop-producer-card-icon" aria-hidden>
        {icon}
      </div>
      <p className="shop-producer-card-region">{region}</p>
      <h3>{name}</h3>
      <p className="shop-producer-card-specialty">{specialty}</p>
      <p className="shop-producer-card-story">{story}</p>
    </article>
  )
}
