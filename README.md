# Graph browser

Small in-browser tool to explore search, and filter RDF data.

## Installing

First, you need to create a JSON file containing an array of JSON-triples and save it to `public/data.json`.

Example of JSON-triples:
```json
[
  {
    "subject" : {
      "value" : "https://fornpunkt.se/tagg/bro",
      "type" : "uri"
      },
    "predicate" : {
      "value" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      "type" : "uri"
      },
    "object" : {
      "value" : "http://schema.org/DefinedTerm",
      "type" : "uri"
      }
    },
  {
    "subject" : {
      "value" : "https://fornpunkt.se/tagg/bro",
      "type" : "uri"
      },
    "predicate" : {
      "value" : "http://schema.org/name",
      "type" : "uri"
      },
    "object" : {
      "value" : "bro",
      "lang" : "sv",
      "type" : "literal"
    }
  }
]
```

A way to create JSON triples is to use the rapper utility:

```bash
rapper --input turtle rdf.ttl --output json-triples > data.json
```

Then you can install the dependencies and run the server:

```bash
npm install
npm start
```
