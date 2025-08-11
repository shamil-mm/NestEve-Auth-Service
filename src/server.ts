
import app from "./app";
import config from "./config/config";
const PORT = process.env.PORT;
console.log('db url',config.DB_URI)

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});



