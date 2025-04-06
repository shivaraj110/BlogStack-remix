import PublicFooter from "~/components/PublicFooter";
import PublicNavbar from "~/components/PublicNavbar";
import TeamMember from "~/components/TeamProfile";
const Team = () => {
  return (
    <div className="flex-col">
      <PublicNavbar />
      <h1 className="m-5 flex justify-center font-semibold text-2xl">
        Our Team
      </h1>

      <div className="flex:col sm:flex space-x-10 p-10 justify-center">
        <TeamMember
          commits={25}
          name="itsKrish01"
          bio="Software developer"
          contributions={684}
          location="India"
          email=""
          pfpUrl="https://avatars.githubusercontent.com/u/72066631?v=4"
          badges={[{ type: "yolo" }, { type: "developer" }]}
          x="x.com"
          repos={46}
        />
        <TeamMember
          name="shivaraj110"
          bio="nvim btw"
          commits={65}
          contributions={657}
          location="Earth"
          email="shivarajchandaragi9@gmail.com"
          pfpUrl="https://avatars.githubusercontent.com/u/175675300?v=4"
          badges={[{ type: "yolo" }, { type: "developer" }]}
          x="https://x.com/shivaraj_does"
          repos={31}
        />
      </div>
      <PublicFooter />
    </div>
  );
};
export default Team;
