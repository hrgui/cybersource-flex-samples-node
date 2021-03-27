import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as flex from "@cybersource/flex-sdk-web";
import { TextField, NativeSelect, Button } from "@material-ui/core";
import { useForm } from "react-hook-form";
import JSONTree from "react-json-tree";

interface Inputs {
  cardType;
  cardNumber;
  securityCode;
  expiryMonth;
  expiryYear;
}

function createToken(jwk, data) {
  return new Promise((resolve, reject) => {
    return flex.createToken(
      {
        kid: jwk.kid,
        keystore: jwk,
        cardInfo: data,
        encryptionType: "rsaoaep256",
        // production: true // without specifying this tokens are created in test env
      },
      (response) => {
        if (response.error) {
          return reject(response.error);
        }
        return resolve(response);
      }
    );
  });
}

function CreditCardForm({ onSubmit, initialValues }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const expiryYearOptions = Array.from(new Array(10)).map((_, i) => {
    return <option key={i}>{currentYear + 1}</option>;
  });

  const { register, handleSubmit } = useForm<Inputs>({
    defaultValues: initialValues,
  });

  return (
    <>
      <div>
        Card Type:{" "}
        <NativeSelect inputRef={register} className="form-control" id="cardType" name="cardType">
          <option value="001">VISA</option>
          <option value="002">MASTERCARD</option>
          <option value="003">AMEX</option>
        </NativeSelect>
      </div>
      <div>
        <TextField
          inputRef={register}
          label={"Card Number"}
          name="cardNumber"
          inputProps={{ maxLength: 19 }}
          fullWidth
        />
      </div>
      <div>
        <TextField
          inputRef={register}
          label={"Security code"}
          name="securityCode"
          inputProps={{ maxLength: 4 }}
          fullWidth
        />
      </div>
      <div>
        Expire Date (MM/YY):{" "}
        <NativeSelect name="expiryMonth" inputRef={register}>
          <option value="01">01 (JAN)</option>
          <option value="02">02 (FEB)</option>
          <option value="03">03 (MAR)</option>
          <option value="04">04 (APR)</option>
          <option value="05">05 (MAY)</option>
          <option value="06">06 (JUN)</option>
          <option value="07">07 (JUL)</option>
          <option value="08">08 (AUG)</option>
          <option value="09">09 (SEP)</option>
          <option value="10">10 (OCT)</option>
          <option value="11">11 (NOV)</option>
          <option value="12">12 (DEC)</option>
        </NativeSelect>
        <NativeSelect name="expiryYear" inputRef={register}>
          {expiryYearOptions}
        </NativeSelect>
      </div>
      <div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disableElevation
          variant="contained"
          color="primary"
        >
          Pay now
        </Button>
      </div>
    </>
  );
}

function App() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const [res, setRes] = React.useState<any>(null);

  async function onSubmit(data: Inputs) {
    const jwkRes = await fetch("/api/checkout");
    const jwk = await jwkRes.json();

    try {
      const token = await createToken(jwk, data);
      
      const receiptRes = await fetch("/api/receipt", {method: "POST", headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }, body: JSON.stringify({...data, flexresponse: token})});
      const receipt = await receiptRes.json();

      setRes({data, token, receipt});
    } catch(e) {
      setRes({data, error: e});
    }

  }

  return (
    <>
    <CreditCardForm
      initialValues={{
        cardType: "001",
        cardNumber: "4111111111111111", // VISA TEST card for cybersource
        securityCode: "111",
        expiryMonth: currentMonth < 10 ? `0${currentMonth}` : currentMonth + "",
        expiryYear: currentYear + 1,
      }}
      onSubmit={onSubmit}
    />
    {res && <JSONTree data={res} />}
    </>
  );
}

export default App;
