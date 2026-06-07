import FlaticonIcon from './FlaticonIcon'

export default function Logo({ className = 'h-7 w-7' }) {
  return (
    <div
      className={`${className} flex items-center justify-center rounded-md bg-gradient-to-br from-[#c5a16e] to-[#8c6640] p-1`}
    >
      <FlaticonIcon name="honey" size={22} alt="" />
    </div>
  )
}