
var shoe = require('shoe');
var emitStream = require('emit-stream');
var JSONStream = require('JSONStream');

module.exports = [
  '$resource',
  Jobs
];

/**
 * properties
 *   - list: [] 
 */
var jobs;

/**
 * transform response from server then return the transform result
 * @return {Array} all the jobs
 */
function refreshAll(data) {
  data = angular.fromJson(data);
  jobs.list.splice(0, jobs.list.length);
  jobs.list.push.apply(jobs.list, data);
  return jobs.list;
}

/**
 * get notification and maintain the singleton job list in this app
 * @param {Jobs} Jobs model 
 * @param {$log} $log logger from ng
 */
function Jobs($resource) {
  var parser = JSONStream.parse([true]);
  var stream = parser.pipe(shoe('/jobs-socket')).pipe(parser);
  var ev = emitStream(stream);
  jobs = $resource('/jobs/:id', null, {
    create: { method: 'POST' },
    show: { method: 'GET' },
    update: { method: 'PUT', params: { id: '@id' } },
    all: { method: 'GET', isArray: true, transformResponse: refreshAll },
    remove: { method: 'DELETE' }
  });

  jobs.removeById = function(id) {
    return this.remove({id: id});
  };

  jobs.findById = jobs.id = function(id, fn) {
    return this.show({id: id}, fn);
  };
  
  ev.on('create', oncreate);

  jobs.list = [];

  return jobs;
}

/**
 * check if job is already in the job list
 * @param  {Object}  job item
 * @return {Boolean}
 */
function has(job) {
  return jobs.list.filter(function(aJob) {
    return aJob._id === job._id;
  }).length > 0;
}

/**
 * when receive a job msg from server then add the job to cache
 * @param {Object} job item from server
 * @return
 */
function oncreate(job) {
  if (has(job)) {
    return;
  }
  jobs.list.push(job);
}


