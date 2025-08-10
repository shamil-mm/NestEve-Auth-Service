
import app from "./app";
const PORT = process.env.PORT;
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});



