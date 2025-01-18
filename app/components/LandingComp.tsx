import {
    Link,
  } from "react-router-dom";
  import { BookOpen, Pencil, Users } from "lucide-react";
  import {
    SignInButton,
    SignUpButton,
  } from "@clerk/remix";
export default function LandingComp(){
      const blogs = [ {
        id: 1,
        title: "featured blog",
        content: "content of featured blog",
        author: {
          name: "John",
        },
        publishDate: "12/12/2023",
      },]
      let featuredBlogs = [blogs[0], blogs[0], blogs[0]];
    
    
    return       <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-600 to-blue-800">
    <header className=" poppins-regular flex justify-center">
      {" "}
      <div className="container bg-white/55 border-[1.5px] border-blue-200 rounded-[30px] mt-6 backdrop-blur-xl w-fit transi p-3">
        {" "}
        <div className="flex flex-row justify-center gap-6 items-center">
          {" "}
          <Link
            to="/"
            className="text-2xl font-bold poppins-semibold text-blue-600 sm:mr-24 sm:mb-0">
            {" "}
            BlogStack{" "}
          </Link>{" "}
          <nav>
            {" "}
            <ul className="flex flex-wrap justify-center poppins-regular space-x-4">
              {" "}
              <li>
                {" "}
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-blue-600 transition-colors">
                  {" "}
                  About{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-blue-600 transition-colors">
                  {" "}
                  Contact{" "}
                </Link>{" "}
              </li>{" "}
              <li className="text-gray-600">
                {" "}
                <SignUpButton />
              </li>{" "}
              <li className="text-gray-600">
                {" "}
                <SignInButton />
              </li>{" "}
            </ul>{" "}
          </nav>{" "}
        </div>{" "}
      </div>{" "}
    </header>{" "}
    <main className="flex-grow">
      {" "}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 poppins-regular border-b text-white py-20">
        {" "}
        <div className="container mx-auto px-4 h-fit text-center">
          {" "}
          <h1 className="text-5xl font-bold transi mb-6 bg-gradient-to-r sm:h-16 h-28 from-blue-600 via-blue-300 to-blue-600 text-transparent bg-clip-text">
            Welcome to BlogStack
          </h1>{" "}
          <p className="text-xl mb-6 max-w-2xl mx-auto text-white/65">
            {" "}
            Elevate your writing, connect with readers, and build your
            online presence with our powerful blogging platform.{" "}
          </p>{" "}
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-white/30 hover:bg-white/60 border-[1.5px] backdrop-blur-lg hover:text-gray-700/90 text-white/90 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            {" "}
            Get Started{" "}
          </Link>{" "}
        </div>{" "}
      </section>{" "}
      <section className="py-16 poppins-light">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            {" "}
            Why Choose BlogStack?{" "}
          </h2>{" "}
          <div className="grid md:grid-cols-3 gap-8">
            {" "}
            <div className=" border-[1.5px] bg-white/60 backdrop-blur-sm p-6 rounded-lg shadow-md">
              {" "}
              <Pencil className="w-10 h-10 text-blue-600 mb-4" />{" "}
              <h3 className="text-xl font-semibold mb-2 text-blue-600 ">
                {" "}
                Easy to Use{" "}
              </h3>{" "}
              <p className="text-gray-700">
                {" "}
                Intuitive interface designed for writers of all levels.
                Start creating beautiful posts in minutes.{" "}
              </p>{" "}
            </div>{" "}
            <div className=" border-[1.5px] bg-white/60 backdrop-blur-sm p-6 rounded-lg shadow-md">
              {" "}
              <BookOpen className="w-10 h-10 text-blue-600 mb-4" />{" "}
              <h3 className="text-xl font-semibold mb-2 text-blue-600 ">
                {" "}
                Rich Features{" "}
              </h3>{" "}
              <p className="text-gray-700">
                {" "}
                From markdown support to SEO tools, we provide everything
                you need to make your content shine.{" "}
              </p>{" "}
            </div>{" "}
            <div className=" border-[1.5px] bg-white/60 backdrop-blur-sm p-6 rounded-lg shadow-md">
              {" "}
              <Users className="w-10 h-10 text-blue-600 mb-4" />{" "}
              <h3 className="text-xl font-semibold mb-2 text-blue-600 ">
                {" "}
                Growing Community{" "}
              </h3>{" "}
              <p className="text-gray-700">
                {" "}
                Connect with other writers, collaborate on projects, and
                grow your audience organically.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="py-16  poppins-light">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <h2 className="text-3xl font-bold text-white/90 mb-8 text-center">
            {" "}
            Featured Posts{" "}
          </h2>{" "}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {" "}
            {featuredBlogs.map((post) => (
              <div
                key={post?.id}
                className="bg-white border-[1.5px] bg-white/60 backdrop-blur-sm rounded-lg hover:-translate-y-4 transi  shadow-md overflow-hidden">
                {" "}
                <div className="p-6">
                  {" "}
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">
                    {" "}
                    {}{" "}
                  </h3>{" "}
                  <p className="text-gray-700 mb-4">
                    {post?.content
                      ? post?.content.slice(0, 100) + "..."
                      : "loading..."}
                  </p>{" "}
                  <div className="flex justify-between items-center">
                    {" "}
                    <div className="text-sm text-gray-500">
                      {" "}
                      <p>{post?.author.name}</p>{" "}
                      <p>{post?.publishDate}</p>{" "}
                    </div>{" "}
                    <Link
                      to={`/blog/${Number(post?.id)}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      {" "}
                      Read More{" "}
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <Link
        to={`/blogs`}
        className="px-4 py-2 bg-blue-600 text-white rounded max-w-32 mx-auto text-center bg-white/30 font-semibold hover:bg-white/60 border-[1.5px] backdrop-blur-lg hover:text-gray-700/90 text-white/90 mb-8 flex flex-col hover:bg-blue-700 transition-colors">
        {" "}
        More posts{" "}
      </Link>{" "}
      <section className="py-16 poppins-light bg-gray-100">
        {" "}
        <div className="container mx-auto px-4 text-center">
          {" "}
          <h2 className="text-3xl font-bold mb-6 text-gray-500 ">
            {" "}
            Stay Updated{" "}
          </h2>{" "}
          <p className="mb-8 max-w-2xl mx-auto text-gray-500 ">
            {" "}
            Subscribe to our newsletter for the latest blogging tips,
            feature updates, and community highlights.{" "}
          </p>{" "}
          <form className="flex max-w-md mx-auto sm:flex-row flex-col ">
            {" "}
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-4 py-2 sm:rounded-l-lg sm:rounded-none rounded-lg border-t border-b border-l border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />{" "}
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold sm:rounded-r-lg sm:rounded-none rounded-lg sm:mt-0 mt-4 hover:bg-blue-700 transition-colors">
              {" "}
              Subscribe{" "}
            </button>{" "}
          </form>{" "}
        </div>{" "}
      </section>{" "}
    </main>{" "}
    <footer className="bg-blue-600 text-white poppins-light py-8">
      {" "}
      <div className="container mx-auto px-4">
        {" "}
        <div className="grid md:grid-cols-3 gap-8">
          {" "}
          <div>
            {" "}
            <h3 className="text-lg font-semibold mb-4">BlogStack</h3>{" "}
            <p className="text-sm">
              {" "}
              Empowering writers to share their stories with the world.{" "}
            </p>{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="text-lg font-semibold mb-4">
              Quick Links
            </h3>{" "}
            <ul className="space-y-2">
              {" "}
              <li>
                {" "}
                <Link to="/about" className="text-sm hover:underline">
                  {" "}
                  About Us{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link to="/features" className="text-sm hover:underline">
                  {" "}
                  Features{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link to="/pricing" className="text-sm hover:underline">
                  {" "}
                  Pricing{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link to="/contact" className="text-sm hover:underline">
                  {" "}
                  Contact{" "}
                </Link>{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="text-lg font-semibold mb-4">Legal</h3>{" "}
            <ul className="space-y-2">
              {" "}
              get
              <li>
                {" "}
                <Link to="/privacy" className="text-sm hover:underline">
                  {" "}
                  Privacy Policy{" "}
                </Link>{" "}
              </li>{" "}
              <li>
                {" "}
                <Link to="/terms" className="text-sm hover:underline">
                  {" "}
                  Terms of Service{" "}
                </Link>{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
        </div>{" "}
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          {" "}
          <p>
            {" "}
            &copy; {new Date().getFullYear()} BlogStack. All rights
            reserved.{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </footer>{" "}
  </div>
}