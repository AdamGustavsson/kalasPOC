/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  GraphQLLimitedString
} from 'graphql-custom-types';    
    
    
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

import {
  // Import methods that your schema can use to interact with your database
  Party,
  Child,
  Parent, 
  getParties,
  getParty,
  getHostParties,
  getParent,
  addChildToParty,
  getChildrenForParty,
  createParent,
  putParty,
  getChild,
  getChildren,
  createChild,
  User,
  Widget,
  getUser,
  getViewer,
  getWidget,
  getWidgets,
} from './database';

/**
 * We get the node interface and field from the Relay library.
 *
 * The first method defines the way we resolve an ID to its object.
 * The second defines the way we resolve an object to its GraphQL type.
 */
var {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    var {type, id} = fromGlobalId(globalId);
    if (type === 'Party') {
      return getParty(id);
    } else if (type === 'Child') {
      return getChild(id);
    } else if (type === 'Parent') {
      return getParent(id);
    } else if (type === 'User') {
      return getUser(id);
    } else if (type === 'Widget') {
      return getWidget(id);
    } else {
      return null;
    }
  },
  (obj) => {
    if (obj instanceof Party) {
      return partyType;
    } else if (obj instanceof Child)  {
      return childType;
    } else if (obj instanceof Parent)  {
      return parentType;
    } else if (obj instanceof User) {
      return userType;
    } else if (obj instanceof Widget)  {
      return widgetType;
    } else {
      return null;
    }
  }
);

/**
 * Define your own types here
 */
var partyType = new GraphQLObjectType({
  name: "Party",
  description: "Party content",
  fields: () => ({
    id: globalIdField('Party'),
    description: {type: GraphQLString},
    hostParentId: {type: GraphQLString},
    childName: {type: GraphQLString},
    dateTime:   {type: GraphQLString},
    venueDescription:   {type: GraphQLString},
    venueName:   {type: GraphQLString}, 
    invitedChildren: {
        type: new GraphQLList(childType),
        description: 'The children that are invited to the party',
        resolve: (party) => getChildrenForParty(party.id),     
    }, 
  }),
 interfaces: [nodeInterface],
});

var parentType = new GraphQLObjectType({
  name: "Parent",
  description: "Parents are the users of the system",
  fields: () => ({
    id: globalIdField('Parent'),
    name: {type: GraphQLString},
    mobileNumber: {type: GraphQLString},
    parties: {
        type: new GraphQLList(partyType),
        description: 'A collection of parties that the parent is administrating',
        resolve: (parent) => getHostParties(parent.id),     
    },  
  }),

 interfaces: [nodeInterface],
});


var childType = new GraphQLObjectType({
  name: "Child",
  description: "Child that is either a guest of a party or the birthday child",
  fields: () => ({
      id: globalIdField('Child'),
      name: {type: GraphQLString},
      birthDate: {type: GraphQLString},
      }),
  interfaces: [nodeInterface],
});

var userType = new GraphQLObjectType({
  name: 'User',
  description: 'A person who uses our app',
  fields: () => ({
    id: globalIdField('User'),
    widgets: {
      type: widgetConnection,
      description: 'A person\'s collection of widgets',
      args: connectionArgs,
      resolve: (_, args) => connectionFromArray(getWidgets(), args),
    },
  }),
  interfaces: [nodeInterface],
});

var widgetType = new GraphQLObjectType({
  name: 'Widget',
  description: 'A shiny widget',
  fields: () => ({
    id: globalIdField('Widget'),
    name: {
      type: GraphQLString,
      description: 'The name of the widget',
    },
  }),
  interfaces: [nodeInterface],
});

/**
 * Define your own connection types here
 */
var {connectionType: widgetConnection} =
  connectionDefinitions({name: 'Widget', nodeType: widgetType});

var {connectionType: partyConnection} =
  connectionDefinitions({name: 'Party', nodeType: partyType});

/**
 * This is the type that will be the root of our query,
 * and the entry point into our schema.
 */
var queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    // Add your own root fields here
    parties: {
      type: new GraphQLList(partyType),
      resolve: () => getParties(),
    },
    children:{
        type: new GraphQLList(childType),
        resolve: () => getChildren(),
    },
    parent:{
        type: parentType,
        resolve: () => getParent(),
    },
    viewer: {
      type: parentType,
      resolve: () => getViewer(),
    },    
  }),
});



var CreateChildMutation = mutationWithClientMutationId({
    name: 'CreateChild',
    inputFields: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        name: {type: new GraphQLLimitedString(1, 100)},
        birthDate: {type: new GraphQLLimitedString(24, 24)},                              
    },
    outputFields: {
        child: {
          type: childType,
          resolve: ({id}) => getChild(id),
        }
    },
    mutateAndGetPayload: ({id,name, birthDate}) => {
        var newChild = new Child();
        newChild.id = id;
        newChild.name = name;
        newChild.birthDate = birthDate;
        createChild(newChild);
        return {id};
    },
});

var addChildToPartyMutation = mutationWithClientMutationId({
    name: 'AddChildToParty',
    inputFields: {
        childId: {type: new GraphQLNonNull(GraphQLString)},
        name: {type: new GraphQLLimitedString(1, 100)},
        partyId: {type: new GraphQLNonNull(GraphQLString)}
    },
    outputFields: {
        child: {
          type: childType,
          resolve: ({childId}) => getChild(childId),
        },
        party: {
          type: partyType,
          resolve: ({partyId}) => getParty(partyId),
        }
    },
    mutateAndGetPayload: ({childId,name,partyId}) => {
        var newChild = new Child();
        newChild.id = childId;
        newChild.name = name;
        createChild(newChild);
        addChildToParty(childId,partyId);
        return {childId,partyId};
    },
});


var CreatePartyMutation = mutationWithClientMutationId({
    name: 'CreateParty',
    inputFields: {
        hostParentId:{type: new GraphQLNonNull(GraphQLID)},
        id: {type: new GraphQLNonNull(GraphQLString)},
        description: {type: new GraphQLLimitedString(1, 30)},
        dateTime: {type: new GraphQLLimitedString(24, 24)}
    },
    outputFields: {
        party: {
          type: partyType,
          resolve: ({id}) => getParty(id) ,
        }
    },
    mutateAndGetPayload: ({hostParentId,id,description,dateTime}) => {
        var newParty = new Party();
        newParty.id=id;
        newParty.description= description;
        newParty.dateTime= dateTime;
        newParty.hostParentId=hostParentId
        putParty(newParty);
    
        console.log("created party in mutateAndGetPayload ");
        console.log(newParty);
        return {id};
    },
});
 
/**
 * This is the type that will be the root of our mutations,
 * and the entry point into performing writes in our schema.
 */
var mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    // Add your own mutations here
      createChild: CreateChildMutation,
      addChildToParty: addChildToPartyMutation,
      createParty: CreatePartyMutation,
  })
});

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export var Schema = new GraphQLSchema({
  query: queryType,
  // Uncomment the following after adding some mutation fields:
  mutation: mutationType
});
