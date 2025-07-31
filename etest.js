function leftMerge(list, index) {
  list[index] += list[index + 1];
  list.splice(index + 1, 1);
  return list;
}

console.log(leftMerge(["a", "b", "c", "d"], 2));