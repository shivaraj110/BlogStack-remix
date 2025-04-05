import { Link } from "@remix-run/react";
import { Axe, CodeXml, Flame, Github, MapPin, Twitter } from "lucide-react";
import { Profile } from "~/types/Team";
const TeamMember = (profile: Profile) => {
  return (
    <div className="flex-col bg-slate-500/10 min-w-[300px] max-w-[350px] border border-blue-500 hover:bg-blue-500/20 transition-all duration-200 justify-center text-center text-sm  m-10 p-5 rounded-xl items-center">
      <div className="flex justify-center">
        <img src={profile.pfpUrl} className="rounded-full size-20 " />
      </div>

      <h4 className="text-2xl font-bold p-2">{profile.name}</h4>
      <div className="flex text-lime-400 justify-center items-center space-x-2">
        <MapPin size={15} />
        <p>{profile.location}</p>
      </div>
      <div className="text-gray-300 space-y-2 p-2">
        <p>{profile.bio}</p>
        <p>{profile.repos + " repos"}</p>
        <p>{profile.contributions + " contributions to blogstack.site"}</p>
      </div>
      <div className="grid grid-cols-2 space-x-2">
        <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all duration-200 font-medium text-xs">
          <Axe size={20} />
          <p>{profile.badges[0].type}</p>
        </div>
        <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-all duration-200 font-medium text-xs">
          <CodeXml size={20} />
          <p>{profile.badges[1].type}</p>
        </div>
        <div className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-200 font-medium text-xs mt-3">
          <Flame size={20} />
          <p>{"from the day 1"}</p>
        </div>
      </div>
      <Link
        to={"https://github.com/" + profile.name}
        className="mt-3 flex items-center space-x-1 px-3 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-lg transition-all duration-200 font-medium text-xs justify-center"
      >
        <Github size={20} />
        <p>GitHub</p>
      </Link>
      <Link
        to={"https://x.com/" + profile.name}
        className="mt-3 flex items-center space-x-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all duration-200 font-medium text-xs justify-center"
      >
        <Twitter size={20} />
        <p>Twitter</p>
      </Link>
    </div>
  );
};
export default TeamMember;
