const express = require("express");
var https = require("https");
const app = express();
const port = 3000;
const submissionsUrl =
  "https://api.fillout.com/v1/api/forms/cLZojxk94ous/submissions";
const token = process.env.FILLOUT_TOKEN;
if (!token) {
  console.error("Please set FILLOUT_TOKEN env variable!!!");
}
app.get("/filteredResponses", async (req, res) => {
  let { filters, ...otherParams } = req.query;
  let responses = await getReponses(otherParams);
  if (filters?.length) {
    responses = filterReponses(responses, filters);
  }
  res.send(responses);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

const getReponses = async (params) => {
  var url = new URL(submissionsUrl);

  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status == 200) {
    return (await response.json()).responses;
  } else {
    throw Error(await response.text());
  }
};

const filterReponses = (responses, filters) => {
  return responses.filter((response) => {
    let filterResponse = true;
    filters.forEach((filter) => {
      const filteredQuestion = response.questions.find(
        (question) => question.id == filter.id
      );
      switch (filter.condition) {
        case "equals":
          if (filteredQuestion.value != filter.value) {
            filterResponse = false;
          }
          break;
        case "does_not_equal":
          if (filteredQuestion.value == filter.value) {
            filterResponse = false;
          }
          break;
        case "greater_than":
        case "less_than":
          let responseValue, filterValue;
          if (filteredQuestion.type == "DatePicker") {
            responseValue = new Date(filteredQuestion.value);
            filterValue = new Date(filter.value);
          } else if (filteredQuestion.type == "NumberInput") {
            responseValue = Number(filteredQuestion.value);
            filterValue = Number(filter.value);
          }
          if (
            filter.condition == "greater_than"
              ? responseValue < filterValue
              : responseValue > filterValue
          ) {
            filterResponse = false;
          }
          break;
      }
    });
    return filterResponse;
  });
};
