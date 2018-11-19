const sdk = require("kinvey-flex-sdk");
sdk.service(function(err, flex) {
  const flexFunctions = flex.functions; // gets the FlexFunctions object from the service

  function afterHospitalFetch(context, complete, modules) {
    var username = context.username;
    var followersCollection = modules.dataStore().collection("followers");

    if (context.entityId != null) {
      context.body.following = false;
      const query = new modules.Query();
      query.equalTo("UserId", username);
      query.equalTo("HospitalId", Number(context.entityId));
      followersCollection.find(query, function(err, docs) {
        if (err) {
          return complete()
            .setBody({ error: "error" })
            .ok()
            .next();
        } else {
          if (docs.length > 0) {
            context.body.following = true;
          }
          return complete()
            .setBody(context.body)
            .ok()
            .next();
        }
      });
    } else {
      return complete()
        .setBody(context.body)
        .ok()
        .next();
    }
  }

  function beforePostReading(context, complete, modules) {
    return complete().next();
  }

  function getMyFeed(context, complete, modules) {
    var username = context.username;

    const query = new modules.Query();
    query.equalTo("UserId", username);

    var username = context.username;
    var followersCollection = modules.dataStore().collection("followers");
    var postsCollection = modules.dataStore().collection("posts");
    var hospitalsCollection = modules.dataStore().collection("hospitals");

    followersCollection.find(query, function(err, followers) {
      var hospitalIds = followers.map(function(item) {
        return item.HospitalId;
      });

      if (hospitalIds.length === 0) {
        return complete()
          .setBody([])
          .ok()
          .next();
      } else {
        const q2 = new modules.Query();
        q2.contains("HospitalId", hospitalIds);
        postsCollection.find(q2, function(err, posts) {
          const q3 = new modules.Query();
          q3.contains("_id", hospitalIds);
          hospitalsCollection.find(q3, function(err, hospitals) {
            posts.forEach(function(post) {
              var hospital = hospitals.filter(function(h) {
                return h._id == post.HospitalId;
              })[0];
              post.hospitalName = hospital.Name;
              post.hospitalPicture = hospital.ImageUrl;
            });
            return complete()
              .setBody(posts)
              .ok()
              .next();
          });
        });
      }
    });
  }
  flexFunctions.register("myfeedYeah", getMyFeed);
  flexFunctions.register("afterHospitalFetch", afterHospitalFetch);
  flexFunctions.register("beforePostReading", beforePostReading);
});
