# interview-takehome

SoilFLO Interview takehome

## Requirements

- Write an API
- API should be written in typescript
- API should use ExpressJS or NestJS
- API should follow RESTful structure
- API should have a connection to an SQL database. (Postgres, SQLite, MySQL)

### Schema

```
sites: {
  id: number,
  name: string,
  address: string,
  description: string
}
trucks: {
  id: number,
  license: string,
  siteId: number
}
```

## Goal:

Context

- There are ~100,000 construction sites in the SitesJSONData file
- A Site is a place/location that sends or receives materials e.g. Soil
- For Construction, Soil is often removed to build the foundations, and in some cases soil is needed to level a building
- A construction site can have many dump trucks running in a single day. Removing soil/materials from the site and being transferred to another site
- There are ~1000 trucks in the TrucksJSONData file

### Requirements:

- The API should connect to a SQL database that contains the sites & trucks provided in the JSON.
- On top of the existing trucks and sites, we need to be able to create a ticket for a truck that describes a load of material being dispatched off site.
- A truck can have many tickets and a ticket can only be dispatched from one truck
- A ticket has a time it was dispatched
- A ticket has a number that is incremented per site
- A ticket has a material that is `Soil`

- Create an API endpoint that creates tickets in bulk for a truck
  - Two tickets cannot have the same dispatched time for the same truck
  - Tickets cannot be dispatched at a future date
- Create a fetch endpoint for all tickets that can be filtered by:
  - sites
  - date range
- Response data should include the following:
  - Name of the site
  - License plate of the truck
  - Ticket number
  - Ticket dispatched time
  - Name of material

### Notes

-  We will score it on:
   - Complete to spec
   - Code was readable and used TypeScript well
   - Was easy to setup and run by the reviewers
   - Quality work
   - Observation work

