import PublicFooter from "~/components/PublicFooter";
import PublicNavbar from "~/components/PublicNavbar";
import TeamMember from "~/components/TeamProfile";
const Team = () => {
  return (
    <div className="flex-col">
      <PublicNavbar />
      <div className="flex:col sm:flex space-x-10 p-10 justify-center">
        <TeamMember
          name="krishDiddy"
          bio="big dick energy"
          contributions={69}
          location="your mamas bathroom"
          email="krish@pornhub.com"
          pfpUrl="https://avatars.githubusercontent.com/u/72066631?v=4"
          badges={[
            { type: "codewright", color: "blue" },
            { type: "developer", color: "green" },
          ]}
          x="x.com/pervertKrish"
          repos={69}
        />
        <TeamMember
          name="krishDiddy"
          bio="big dick energy"
          contributions={69}
          location="your mamas bathroom"
          email="krish@pornhub.com"
          pfpUrl="https://avatars.githubusercontent.com/u/72066631?v=4"
          badges={[
            { type: "codewright", color: "blue" },
            { type: "developer", color: "green" },
          ]}
          x="x.com/pervertKrish"
          repos={69}
        />
      </div>
      <PublicFooter />
    </div>
  );
};
export default Team;
