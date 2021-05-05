module.exports = (api) => {
  // The only difference between this and get_currency is that this cannot
  // be used to derive non-static properties of a currency like bestcurrencystate
  api.native.get_currency_definition = async (chain, currencyid) => {
    if (api.native.cache.currency_definition_cache[currencyid]) {
      return api.native.cache.currency_definition_cache[currencyid]
    } else {
      const definition = await api.native.callDaemon(chain, 'getcurrency', [currencyid])
      let { name } = definition

      if (
        definition.currencyid !== definition.systemid &&
        definition.parent !== "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
      ) {
        name = `${name}.${
          (await api.native.get_currency_definition(chain, definition.systemid))
            .name
        }`;
      }

      const processedDefinition = {
        ...definition,
        name,
      }

      api.native.cache.currency_definition_cache[currencyid] = processedDefinition
      return processedDefinition
    }
  }

  api.native.get_currency = async (chain, currencyid) => {
    try {
      const currencyObject = await api.native.callDaemon(chain, 'getcurrency', [currencyid])
      const parent = await api.native.get_currency_definition(chain, currencyObject.systemid)

      const processedCurrencyObject = {
        ...currencyObject,
        systemname: parent.name.toUpperCase(),
        spotterid: chain,
        name:
          currencyObject.systemid !== currencyObject.currencyid &&
          currencyObject.parent !== "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
            ? `${currencyObject.name}.${parent.name}`
            : currencyObject.name,
      };

      if (!api.native.cache.currency_definition_cache[currencyid]) {
        api.native.cache.currency_definition_cache[currencyid] = processedCurrencyObject
      }

      return processedCurrencyObject
    } catch(e) {
      throw e
    }
  };

  api.setPost('/native/get_currency', async (req, res, next) => {
    const { chainTicker, name, systemid } = req.body

    try {
      const retObj = {
        msg: 'success',
        result:  await api.native.get_currency(chainTicker, name, systemid),
      };
  
      res.send(JSON.stringify(retObj));  
    } catch(e) {
      const retObj = {
        msg: 'error',
        result: e.message,
      };
  
      res.send(JSON.stringify(retObj)); 
    }
  });
 
  return api;
};