import Promise from 'bluebird';
import AWS from 'aws-sdk';
const dynamoConfig = {
    region : 'eu-west-1',
    endpoint : 'https://dynamodb.eu-west-1.amazonaws.com'
};
const docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
const stage = 'dev';
const projectName = 'relay-kalas';
const childrenTable = projectName + '-children-' + stage;
const partiesTable = projectName + '-parties-' + stage;
const parentsTable = projectName + '-parents-' + stage;

export class Party {}
export class Child {}
export class Parent {}

export function createParent(parent) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: parentsTable,
      Item: parent
    };

    docClient.put(params, function(err, data) {
      if (err) return reject(err);
      return resolve(parent);
    });

  });
}


export function getParent(id) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: parentsTable,
      Key: {
        id: id
      },
    };

    docClient.get(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Item"]);
    });

  });
}

export function addChildToParty(childId,partyId) {
  return new Promise(function(resolve, reject) {
      var params = {
      TableName: partiesTable,
      Key: {
        id: partyId
      },
    };  

    docClient.get(params, function(err, data) {
      if (err) return reject(err);
      var party = data["Item"];
      party.children.push(childId);
        console.log(party);
      putParty(party);
      return resolve(party);
    });
  });
}    
    
export function putParty(party) {
  return new Promise(function(resolve, reject) {
      if (!party.children) party.children = [];
      var params = {
      TableName: partiesTable,
      Item: party
    };
      console.log(party);
    docClient.put(params, function(err, data) {
      if (err) return reject(err);
      return resolve(party);
    });
  });
}
    
export function getHostParties(parentId) {
    console.log('Getting parties for parentId: ' + parentId);
   return new Promise(function(resolve, reject) {
    var params = {
      TableName: partiesTable,
      FilterExpression: "hostParentId = :id",
      ExpressionAttributeValues: {
            ":id":parentId
      }
    };

    docClient.scan(params, function(err, data) {
      if (err) return reject(err);
        console.log(data["Items"]);
      return resolve(data["Items"]);
    });

  });
}

export function getParty(id) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: partiesTable,
      Key: {
        id: id
      },
    };  
    docClient.get(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Item"]);
    });
      
  });
}
                     
export function getParties() {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: partiesTable,
    };

    docClient.scan(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });

  });
}



export function getChild(id) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: childrenTable,
      Key: {
        id: id
      },
      AttributesToGet: [
        'id',
        'name',
        'birthDate'  
      ]
    };

    docClient.get(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Item"]);
    });

  });
}

export function getChildrenForParty(partyId) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: partiesTable,
      Key: {
        id: partyId
      },
      AttributesToGet: [
        'children', 
      ]
    };

    docClient.get(params, function(err, data) {
      if (err) return reject(err);
      var children = data["Item"];
      var result = [];
      for (var childId in children) {
          result.push(getChild(childId));
        }
        console.log(result);
      return resolve(result);
    });

  });
}
    
export function getChildren() {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: childrenTable,
      AttributesToGet: [
        'id',
        'name',
        'birthDate'  
      ]
    };

    docClient.scan(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });

  });
}

export function createChild(child) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: childrenTable,
      Item: child
    };

    docClient.put(params, function(err, data) {
      if (err) return reject(err);
      return resolve(child);
    });

  });
}    

// Model types
export class User {}
export class Widget {}

// Mock data
var viewer = new User();
viewer.id = '1';
var widgets = ['What\'s-it', 'Who\'s-it', 'How\'s-it'].map((name, i) => {
  var widget = new Widget();
  widget.name = name;
  widget.id = `${i}`;
  return widget;
});


  export function getUser(id){
      if(id === viewer.id){
          return getParent('1');
      }
      return null;
  }
  export function getViewer(){return getParent('1')} 
  export function getWidget(id){return widgets.find(w => w.id === id)}
  export function  getWidgets(){return widgets}
  
    
