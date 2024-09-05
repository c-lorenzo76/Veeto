# Veeto

## Motivation
Veeto was inspired by the many instances when my partner and I struggled to decide where to eat, 
often spending more time second-guessing our options than enjoying a meal. 
Our indecisiveness led me to create a solution—a website designed to help simplify the decision-making process. 
Unlike existing tools that merely list nearby restaurants, Veeto takes user preferences into account to make a tailored recommendation. 
My goal is for others who face the same dilemma to find this platform just as helpful.

## Tech Stack
> Javascript | 
> React | 
> Express

## Directory Structure 
    client/                contains all files for frontend
        src/               contains all source files
            assets/        contains images i.e avatar pfp
            components/    contains components from shadcn, aceternity, etc 
            lib/           contains util.js used for tailwind css
            pages/         contains the pages of the website 
    server/                contains all files for backend
        index.js           backend file for business logic

## Installation
You can install the project using the following command
```
git clone https://github.com/c-lorenzo76/Poll.git
```

### Issues

09/04 <br>
I fixed the issue of only the host being redirected to Questions page. I now need to add the voting
implementation. After I need to adjust it to become a multi step form. Once those two things are in play 
I can make it show the results from the poll. Have it display places to eat according to the responses 
May need to create a new Google account to be able to make requests based off coordinates or see other 
API uses. Maybe don't even need that an could use TripAdvisor API.

08/30 <br>
Okay I believe I fixed the issue with navigating and maintaining the connection of the socket. Had some issues resolving that but now I am able to continue 
to navigate without any hiccups. I might have to refactor my code as its all over the place. I also have lots of unnecessary
functions and emit that don't amount to nothing. So before we work on Questions.jsx tomorrow. I'll fix those issues first. 

08/28 <br>
Currently it is somewhat working. 
Having issues with navigating. 
When I start the game from Lobby and it navigates I lose connection of the socket and therefore deletes lobbies[code]. 
Need to figure out how to maintain that when navigating might have to resolve by rewriting useSocket and UserContext. 




