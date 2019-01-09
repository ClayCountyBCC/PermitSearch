using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime.Caching;


namespace PermitSearch.Models
{
  public class MyCache
  {
    private static MemoryCache _cache = new MemoryCache("myCache");

    public static object GetItem(string key)
    {
      return GetOrAddExisting(key, () => InitItem(key));
    }

    public static DateTime GetDate(string key)
    {
      return GetOrAddExistingDate(key, () => InitDate(key));
    }

    public static object GetItem(string key, CacheItemPolicy CIP)
    {
      return GetOrAddExisting(key, () => InitItem(key), CIP);
    }

    private static T GetOrAddExisting<T>(string key, Func<T> valueFactory, CacheItemPolicy CIP)
    {

      Lazy<T> newValue = new Lazy<T>(valueFactory);
      var oldValue = _cache.AddOrGetExisting(key, newValue, CIP) as Lazy<T>;
      try
      {
        return (oldValue ?? newValue).Value;
      }
      catch
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove(key);
        throw;
      }
    }

    private static T GetOrAddExisting<T>(string key, Func<T> valueFactory)
    {

      Lazy<T> newValue = new Lazy<T>(valueFactory);
      var oldValue = _cache.AddOrGetExisting(key, newValue, GetCIP()) as Lazy<T>;
      try
      {
        return (oldValue ?? newValue).Value;
      }
      catch
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove(key);
        throw;
      }
    }

    private static DateTime GetOrAddExistingDate(string key, Func<DateTime> valueFactory)
    {

      Lazy<DateTime> newValue = new Lazy<DateTime>(valueFactory);
      var oldValue = _cache.AddOrGetExisting(key, newValue, GetCIP()) as Lazy<DateTime>;
      try
      {
        var dateToReturn = (oldValue ?? newValue).Value;
        var item = _cache.Get(key);
        //_cache.Set()
        _cache.Set(key, item, dateToReturn.AddSeconds(630));
        return dateToReturn;
      }
      catch
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove(key);
        throw;
      }
    }

    private static CacheItemPolicy GetCIP(DateTime dateUpdated)
    {
      return new CacheItemPolicy()
      {
        AbsoluteExpiration = dateUpdated.AddSeconds(630)
      };
    }

    private static CacheItemPolicy GetCIP()
    {
      return new CacheItemPolicy()
      {
        AbsoluteExpiration = DateTime.Now.AddSeconds(630)
      };
    }

    private static object InitItem(string key)
    {
      switch (key)
      {
        case "dateupdated":
          return Constants.GetDateUpdated();
        default:
          return null;
      }
    }

    private static DateTime InitDate(string key)
    {
      switch (key)
      {
        case "dateupdated":
          return Constants.GetDateUpdated();
        default:
          return DateTime.Now;
      }
    }


  }
}